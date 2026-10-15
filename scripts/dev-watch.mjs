#!/usr/bin/env node
/**
 * CISPOLY 开发服务器（单进程）：监听 contents/ 数据文件变化 → 自动重建数据 → Vite HMR 刷新页面
 *
 * 用法：npm run dev
 * - 启动时先构建一次数据，再在同进程内启动 Vite（React Router framework mode）
 * - 监听 contents/blogs、contents/academic_published_papers、contents/clinical_guidelines 下
 *   所有文件（md / 图片等）变化，防抖 600ms 后自动重跑 build-data.ts
 * - Vite 检测到 src/data/*.json 变化后自动热更新/刷新页面
 *
 * 为什么在同进程跑 Vite 而不是 spawn 子进程：
 * Windows 终端下 npm → node → cmd(npx) → CLI 的多级子进程链不转发 Ctrl+C，
 * 会导致 npm run dev 无法用 Ctrl+C 停止（服务器变成孤儿进程继续占用端口）。
 * 单进程模式下 Ctrl+C 直接到达 Vite 进程本身，退出可靠且能正常释放端口。
 */
import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

// dev 模式必须用 development 版 React 运行时。
// 若外部环境残留 NODE_ENV=production，Vite 依赖预打包会把 react/jsx-dev-runtime
// 替换成 production 版（不导出 jsxDEV），SSR 渲染时报
// "TypeError: jsxDEV is not a function"。这里统一强制为 development。
if (process.env.NODE_ENV !== 'development') {
  process.env.NODE_ENV = 'development'
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'contents')
const WATCH_DIRS = [
  join(SRC, 'blogs'),
  join(SRC, 'academic_published_papers'),
  join(SRC, 'clinical_guidelines'),
]

let building = false
let pending = false
let timer = null
let buildChild = null
let server = null
let shuttingDown = false
const watchers = []

function killChild(child) {
  if (!child?.pid) return
  try {
    child.kill('SIGTERM')
  } catch {
    // 进程可能已经退出
  }
}

async function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  for (const watcher of watchers) {
    try {
      watcher.close()
    } catch {
      // 忽略重复关闭
    }
  }
  killChild(buildChild)
  if (server) {
    try {
      await server.close()
    } catch {
      // 关闭失败也继续退出
    }
  }
  process.exit(code)
}

function runBuild(reason) {
  return new Promise((resolve) => {
    if (shuttingDown) {
      resolve()
      return
    }

    console.log(`\n[watch] 检测到变更（${reason}），重新构建数据…`)
    // 直接 spawn node（不经过 shell/cmd），保证进程树只有一层，Ctrl+C 可靠传递
    const child = spawn(process.execPath, [join(ROOT, 'scripts', 'build-data.ts')], {
      cwd: ROOT,
      stdio: 'inherit',
    })
    buildChild = child
    child.on('error', (err) => {
      if (buildChild === child) buildChild = null
      console.error(`[watch] 无法启动 build-data：${err.message}\n`)
      resolve()
    })
    child.on('close', (code) => {
      if (buildChild === child) buildChild = null
      if (code === 0) {
        console.log('[watch] 数据已更新 ✓（Vite 将自动刷新页面）\n')
        resolve()
      } else {
        console.error(`[watch] build-data 退出码 ${code}，跳过本次更新\n`)
        resolve()
      }
    })
  })
}

function scheduleBuild(reason) {
  if (timer) {
    pending = true
    return
  }
  timer = setTimeout(async () => {
    timer = null
    if (building) {
      pending = true
      return
    }
    building = true
    await runBuild(reason)
    building = false
    // 构建期间又有变更 → 再跑一次
    if (pending) {
      pending = false
      scheduleBuild('构建期间的新变更')
    }
  }, 600)
}

// 退出信号：SIGINT（Ctrl+C）/ SIGTERM（kill）/ SIGHUP（终端关闭，Windows 控制台关闭时映射为此信号）/
// SIGBREAK（Windows Ctrl+Break）。任一信号到达都先优雅关闭 Vite 再退出，确保端口释放、无孤儿进程。
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  process.once(sig, () => {
    void shutdown(0)
  })
}

// 先构建一次数据，再启动 Vite。
// react-router.config.ts 的 prerender 路径在启动时读取 src/data，
// 必须先生成最新的数据，否则新博客路由会被误判为 404。
await runBuild('启动')
if (shuttingDown) process.exit(0)

try {
  server = await createServer({
    root: ROOT,
    configFile: join(ROOT, 'vite.config.ts'),
  })
  await server.listen()
} catch (err) {
  console.error(`[dev] Vite 启动失败：${err instanceof Error ? err.message : err}`)
  console.error('[dev] 若提示端口被占用，请先结束占用 5173 端口的进程再重试')
  process.exit(1)
}

// 监听数据源目录
for (const dir of WATCH_DIRS) {
  try {
    const watcher = watch(dir, { recursive: true }, (_event, filename) => {
      if (filename) scheduleBuild(filename.split(/[\\/]/).pop() || filename)
    })
    watchers.push(watcher)
    console.log(`[watch] 监听 ${dir}`)
  } catch (err) {
    console.error(`[watch] 无法监听 ${dir}: ${err.message}`)
  }
}
console.log('[watch] 修改 contents/ 下的 markdown 或图片后，页面将自动更新（Ctrl+C 退出）\n')

// Vite HTTP 服务与目录监听会保持事件循环存活，无需额外挂起。
// 退出路径只有一条：SIGINT/SIGTERM（Ctrl+C）→ shutdown() → server.close() 释放端口。
