/**
 * 批量解析 source/pdf 下所有 PDF（用 MinerU 云端 API，paper2poster 的 parse_pdf.py）
 * 每个 PDF 输出到其同目录的 .paper2anything/poster/<stem>/parsed/
 * 产出：content.md / metadata.json / mineru_raw.json / figures/ / tables/
 *
 * 用法：node scripts/batch-parse-pdf.mjs
 */
import { execSync } from 'node:child_process'
import { readdirSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { join, basename } from 'node:path'

const ROOT = process.cwd()
const PDF_ROOT = join(ROOT, 'source', 'pdf')
const PYTHON = join(ROOT, '.venv', 'Scripts', 'python.exe')
const SCRIPTS = 'C:/Users/portos/.agents/skills/paper2poster/scripts'

// 收集所有 PDF
const pdfs = []
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (f.endsWith('.pdf')) pdfs.push(p)
  }
}
walk(PDF_ROOT)
console.log(`共发现 ${pdfs.length} 个 PDF`)

// 已解析的（存在 content.md 则跳过，支持断点续跑）
const toParse = pdfs.filter((p) => {
  const stem = basename(p, '.pdf')
  const outDir = join(dirname(p), '.paper2anything', 'poster', stem, 'parsed')
  return !existsSync(join(outDir, 'content.md'))
})
console.log(`待解析 ${toParse.length} 个（已完成的跳过）`)

function dirname(p) {
  return p.split(/[\\/]/).slice(0, -1).join('/')
}

let ok = 0
let fail = 0
for (const pdf of toParse) {
  const stem = basename(pdf, '.pdf')
  const outDir = join(dirname(pdf), '.paper2anything', 'poster', stem, 'parsed')
  mkdirSync(outDir, { recursive: true })
  try {
    console.log(`\n[${ok + fail + 1}/${toParse.length}] 解析: ${stem.slice(0, 60)}`)
    // 全部用正斜杠路径，避免 Windows 反斜杠转义问题
    const cmd = `"${PYTHON.replace(/\\/g, '/')}" "${SCRIPTS.replace(/\\/g, '/')}/parse_pdf.py" "${pdf.replace(/\\/g, '/')}" --output-dir "${outDir.replace(/\\/g, '/')}"`
    const output = execSync(cmd, { encoding: 'utf-8', timeout: 600000, env: { ...process.env } })
    const lastLines = output.trim().split('\n').slice(-4).join(' | ')
    console.log(`  ✓ ${lastLines.slice(0, 120)}`)
    ok++
  } catch (e) {
    const errMsg = e.stderr ? String(e.stderr).slice(-200) : String(e.message).slice(-200)
    console.log(`  ✗ 失败: ${errMsg}`)
    fail++
  }
}
console.log(`\n完成：成功 ${ok}，失败 ${fail}`)
