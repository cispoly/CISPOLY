#!/usr/bin/env node
/**
 * CISPOLY 开发服务器：监听 contents/ 数据文件变化 → 自动重建数据 → React Router HMR 刷新页面
 *
 * 用法：npm run dev（替代原来的 "node scripts/build-data.ts && vite"）
 * - 启动时先构建一次数据，再启动 Vite
 * - 监听 contents/blogs、contents/academic_published_papers、contents/clinical_guidelines 下
 *   所有文件（md / 图片等）变化，防抖 600ms 后自动重跑 build-data.ts
 * - React Router/Vite 检测到 src/data/*.json 变化后自动热更新/刷新页面
 */
import { execFileSync, spawn } from 'node:child_process'
import { watch } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

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
let vite = null
let shuttingDown = false
const watchers = []

function terminateProcessTree(child) {
  if (!child?.pid) return

  try {
    if (process.platform === 'win32') {
      // `shell: true` starts cmd.exe, so killing only the direct child can
      // leave react-router/Vite running. Kill the complete process tree.
      execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      })
    } else {
      // The non-Windows child is detached below, so its negative PID targets
      // the complete process group rather than only the shell.
      process.kill(-child.pid, 'SIGTERM')
    }
  } catch {
    // The child may have exited between the check and the cleanup call.
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  for (const watcher of watchers) watcher.close()
  terminateProcessTree(buildChild)
  terminateProcessTree(vite)
  process.exit(code)
}

function runBuild(reason) {
  return new Promise((resolve) => {
    if (shuttingDown) {
      resolve()
      return
    }

    console.log(`\n[watch] 检测到变更（${reason}），重新构建数据…`)
    const child = spawn('node scripts/build-data.ts', {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      detached: process.platform !== 'win32',
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

process.once('SIGINT', () => shutdown(0))
process.once('SIGTERM', () => shutdown(0))

// 启动 React Router Framework Mode 开发服务器
vite = spawn('npx react-router dev', {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
  detached: process.platform !== 'win32',
})
vite.on('exit', (code) => {
  if (shuttingDown) return
  console.log(`[dev] Vite 已退出（${code}）`)
  shutdown(code ?? 0)
})

// 先构建一次数据，再让用户看到最新内容
await runBuild('启动')
if (shuttingDown) process.exit(0)

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
