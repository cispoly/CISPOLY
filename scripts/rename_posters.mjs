/**
 * 批量重命名 CISPOLY 文献/指南（文件名 → 短 id）。
 *
 * 处理范围：
 *  1. source/academic_published_papers/<cancer>/<id>.md
 *  2. source/clinical_guidelines/<cancer>_methylation/<id>.md
 *  3. src/data/*.json 中所有旧 id → 新 id 替换
 *  4. public/posters/<cancer>/<old_id>/ → <new_id>
 *  5. source/blogs/posters/ 草稿区目录（若匹配旧 id 则同步改名，保持可追踪）
 *
 * 用法: node scripts/rename_posters.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const mapFile = path.join(ROOT, 'scripts/rename_map.json')
const raw = JSON.parse(fs.readFileSync(mapFile, 'utf8'))

const renames = []
for (const kind of ['papers', 'guidelines']) {
  for (const [cancer, items] of Object.entries(raw[kind])) {
    for (const [oldId, newId] of Object.entries(items)) {
      if (oldId === newId) continue
      renames.push({ kind, cancer, oldId, newId })
    }
  }
}
console.log(`待重命名条目: ${renames.length}`)

const summary = { renamed: 0, skipped: 0, errors: [] }
const idMap = new Map(renames.map(r => [r.oldId, r.newId]))

// ---------- 1. 源文件 ----------
function renameSourceFiles() {
  const baseDirs = {
    papers: {
      cervical: path.join(ROOT, 'source/academic_published_papers/CISCER'),
      endometrial: path.join(ROOT, 'source/academic_published_papers/CISENDO'),
      ovarian: path.join(ROOT, 'source/academic_published_papers/CISOVA'),
    },
    guidelines: {
      cervical: path.join(ROOT, 'source/clinical_guidelines/cervical_cancer_methylation'),
      endometrial: path.join(ROOT, 'source/clinical_guidelines/endometrial_cancer_methylation'),
      ovarian: path.join(ROOT, 'source/clinical_guidelines/ovarian_cancer_methylation'),
    },
  }
  for (const r of renames) {
    const dir = baseDirs[r.kind]?.[r.cancer]
    if (!dir || !fs.existsSync(dir)) { summary.errors.push(`源目录不存在: ${r.kind}/${r.cancer}`); continue }
    const oldPath = path.join(dir, r.oldId + '.md')
    const newPath = path.join(dir, r.newId + '.md')
    if (!fs.existsSync(oldPath)) { summary.skipped++; continue }
    fs.renameSync(oldPath, newPath)
    summary.renamed++
  }
}

// ---------- 2. src/data/*.json id 替换 ----------
function patchDataJsons() {
  const dataDir = path.join(ROOT, 'src/data')
  const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && !f.startsWith('index.'))
  for (const f of jsonFiles) {
    const p = path.join(dataDir, f)
    const text = fs.readFileSync(p, 'utf8')
    let changed = false
    let newText = text
    for (const [oldId, newId] of idMap) {
      // 精确替换 JSON 中的 id 键/值（避免误替换 title 里相同文本）
      if (newText.includes(oldId)) {
        newText = newText.split(oldId).join(newId)
        changed = true
      }
    }
    if (changed) fs.writeFileSync(p, newText)
    summary[`data_${f}`] = changed ? 'patched' : 'no-change'
  }
}

// ---------- 3. public/posters 目录 ----------
function renamePublicPosters() {
  const postersRoot = path.join(ROOT, 'public/posters')
  for (const r of renames) {
    const oldDir = path.join(postersRoot, r.cancer, r.oldId)
    const newDir = path.join(postersRoot, r.cancer, r.newId)
    if (!fs.existsSync(oldDir)) { continue }
    if (fs.existsSync(newDir)) {
      summary.errors.push(`目标目录已存在: ${r.newId}`)
      continue
    }
    fs.renameSync(oldDir, newDir)
  }
}

// ---------- 4. 草稿区目录（source/blogs/posters）----------
function renameDraftDirs() {
  const draftRoot = path.join(ROOT, 'source/blogs/posters')
  if (!fs.existsSync(draftRoot)) return
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        // 若目录名匹配旧 id 则改名
        if (idMap.has(entry.name)) {
          const newName = idMap.get(entry.name)
          const newFull = path.join(dir, newName)
          if (!fs.existsSync(newFull)) fs.renameSync(full, newFull)
        } else {
          walk(full)
        }
      }
    }
  }
  walk(draftRoot)
}

renameSourceFiles()
patchDataJsons()
renamePublicPosters()
renameDraftDirs()

console.log('重命名完成:', JSON.stringify(summary, null, 2))
