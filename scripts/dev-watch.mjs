#!/usr/bin/env node
/**
 * CISPOLY 开发服务器：监听 source/ 数据文件变化 → 自动重建数据 → Vite HMR 刷新页面
 *
 * 用法：npm run dev（替代原来的 "tsx scripts/build-data.ts && vite"）
 * - 启动时先构建一次数据，再启动 Vite
 * - 监听 source/blogs、source/academic_published_papers、source/clinical_guidelines 下
 *   所有文件（md / 图片等）变化，防抖 600ms 后自动重跑 build-data.ts
 * - Vite 检测到 src/data/*.json 变化后自动热更新/刷新页面
 */
import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, 'source')
const WATCH_DIRS = [
  join(SRC, 'blogs'),
  join(SRC, 'academic_published_papers'),
  join(SRC, 'clinical_guidelines'),
]

let building = false
let pending = false
let timer = null

function runBuild(reason) {
  return new Promise((resolve) => {
    console.log(`\n[watch] 检测到变更（${reason}），重新构建数据…`)
    const child = spawn('npx tsx scripts/build-data.ts', {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
    })
    child.on('close', (code) => {
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

// 启动 Vite（端口 5173，与 vite.config.ts 一致）
const vite = spawn('npx vite', {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
})
vite.on('exit', (code) => {
  console.log(`[dev] Vite 已退出（${code}）`)
  process.exit(code ?? 0)
})

// 先构建一次数据，再让用户看到最新内容
await runBuild('启动')

// 监听数据源目录
for (const dir of WATCH_DIRS) {
  try {
    watch(dir, { recursive: true }, (_event, filename) => {
      if (filename) scheduleBuild(filename.split(/[\\/]/).pop() || filename)
    })
    console.log(`[watch] 监听 ${dir}`)
  } catch (err) {
    console.error(`[watch] 无法监听 ${dir}: ${err.message}`)
  }
}
console.log('[watch] 修改 source/ 下的 markdown 或图片后，页面将自动更新（Ctrl+C 退出）\n')

process.on('SIGINT', () => {
  vite.kill()
  process.exit(0)
})
