/**
 * 批量优化海报图面板：图片填满面板（保持比例）
 * 在所有海报的 </style> 前插入覆盖 CSS
 */
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const PATCH = `
  /* ===== 图片填满面板（精细化）===== */
  .figpanel .figwrap {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .figpanel .figwrap img {
    flex: 1 1 auto;
    min-height: 0;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: none;
    object-fit: contain;
    margin: 0 auto;
  }
`

// 收集所有海报（public + source/blogs 草稿区）
const posters = []
for (const cancer of ['cervical', 'endometrial', 'ovarian']) {
  const dir = path.join(ROOT, 'public/posters', cancer)
  if (!fs.existsSync(dir)) continue
  for (const id of fs.readdirSync(dir)) {
    const html = path.join(dir, id, 'poster.html')
    if (fs.existsSync(html)) posters.push(html)
  }
}
// 草稿区（source/blogs/posters）
const draftRoot = path.join(ROOT, 'source/blogs/posters')
function walkDraft(dir) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walkDraft(full)
    else if (e.name === 'poster.html') posters.push(full)
  }
}
walkDraft(draftRoot)

let patched = 0, skipped = 0
for (const p of posters) {
  let t = fs.readFileSync(p, 'utf8')
  if (t.includes('图片填满面板')) { skipped++; continue }
  if (!t.includes('figpanel')) { skipped++; continue }
  t = t.replace('</style>', PATCH + '</style>')
  fs.writeFileSync(p, t)
  patched++
}
console.log(`已补丁: ${patched} 个海报 | 跳过: ${skipped}`)
