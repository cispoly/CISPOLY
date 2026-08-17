/**
 * 慢速重试缺失的 PDF 解析（每次间隔 60 秒，避开 MinerU 限流）
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const PYTHON = join(ROOT, '.venv', 'Scripts', 'python.exe')
const SCRIPTS = 'C:/Users/portos/.agents/skills/paper2poster/scripts'

const pdfs = []
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (f.endsWith('.pdf')) pdfs.push(p)
  }
}
walk(join(ROOT, 'source', 'pdf'))

const missing = pdfs.filter((p) => {
  const stem = basename(p, '.pdf')
  const outDir = join(dirname(p), '.paper2anything', 'poster', stem, 'parsed')
  return !existsSync(join(outDir, 'content.md'))
})
console.log(`待重试: ${missing.length} 个（每个间隔 60 秒）`)

for (const pdf of missing) {
  const stem = basename(pdf, '.pdf')
  const outDir = join(dirname(pdf), '.paper2anything', 'poster', stem, 'parsed').replace(/\\/g, '/')
  let ok = false
  for (let attempt = 1; attempt <= 5 && !ok; attempt++) {
    try {
      console.log(`[尝试 ${attempt}] ${stem.slice(0, 50)}`)
      const cmd = `"${PYTHON.replace(/\\/g, '/')}" "${SCRIPTS}/parse_pdf.py" "${pdf.replace(/\\/g, '/')}" --output-dir "${outDir}"`
      execSync(cmd, { encoding: 'utf-8', timeout: 300000 })
      ok = true
      console.log('  ✓ 成功')
    } catch (e) {
      console.log(`  ✗ 失败（可能限流），60 秒后重试`)
      execSync('sleep 60')
    }
  }
}
console.log('\n重试完成')
