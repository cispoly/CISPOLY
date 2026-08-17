/**
 * 最终修复：按 build-data 的 norm 逻辑（空格→下划线）匹配修正层 key 并替换为新短 id。
 * 用法: node scripts/rename_posters_final.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/rename_map.json'), 'utf8'))

// 旧 id（含变体）→ 新 id
const normMap = new Map() // norm(key) -> newId

function norm(s) {
  return s.replace(/\s+/g, '_').replace(/[｜|]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

for (const kind of ['papers', 'guidelines']) {
  for (const [cancer, items] of Object.entries(raw[kind])) {
    for (const [oldId, newId] of Object.entries(items)) {
      normMap.set(norm(oldId), newId)
      // 空格版
      normMap.set(norm(oldId.replace(/_/g, ' ')), newId)
    }
  }
}

// 特殊变体
const specials = [
  ['13-Yang_等_2025_Focused_ultrasound_ablation_for_women_with_cervical_lesions-Protocol_of_a_randomized', '13_fus_rct_protocol'],
  ['17_Intl_Journal_of_Cancer_-_2026_-_Peng_-_Reply_to_Comments_on_Enhanced_Diagnostic_Accuracy_of_High‐Grade_Cervical', '17_reply_comments'],
  ['5_Qi_et_al_2023_Hypermethylated_CDO1_and_CELF4_in_cytological_specimens_as_triage_strategy', '5_triage_strategy_biomarkers'],
  ['中华医学会检验医学分会_-_2026_-_血液游离DNA甲基化肿瘤标志物实验室检测与临床应用专家共识（2025版）', 'ovarian_cfDNA_consensus2025'],
]
for (const [oldId, newId] of specials) {
  normMap.set(norm(oldId), newId)
  normMap.set(norm(oldId.replace(/_/g, ' ')), newId)
}
// 新 id 自身幂等
for (const v of normMap.values()) normMap.set(norm(v), v)

const dataDir = path.join(ROOT, 'src/data')
const targets = [
  'paper-fields-v2.json',
  'paper-affiliations.json',
  'paper-fields.json',
  'citations.json',
  'guideline-citations.json',
  'guideline-pdf-fields.json',
]

for (const f of targets) {
  const p = path.join(dataDir, f)
  if (!fs.existsSync(p)) continue
  const text = fs.readFileSync(p, 'utf8')
  let newText = text
  const replaced = new Set()
  // 匹配 JSON key 形式："key":  (key 可能是任意非引号字符)
  const keyRe = /"([^"]+)":/g
  let m
  const matches = []
  while ((m = keyRe.exec(text)) !== null) {
    const key = m[1]
    if (replaced.has(key)) continue
    const newId = normMap.get(norm(key))
    if (newId && newId !== key) {
      matches.push({ key, newId })
      replaced.add(key)
    }
  }
  for (const { key, newId } of matches) {
    newText = newText.split(`"${key}":`).join(`"${newId}":`)
  }
  if (matches.length > 0) {
    fs.writeFileSync(p, newText)
    console.log(`patched ${f}: ${matches.length} 个 key 替换`)
  } else {
    console.log(`${f}: 无变化`)
  }
}

// 校验残留
for (const f of targets) {
  const p = path.join(dataDir, f)
  if (!fs.existsSync(p)) continue
  const obj = JSON.parse(fs.readFileSync(p, 'utf8'))
  const keys = Object.keys(obj)
  const longKeys = keys.filter(k => k.length > 50)
  if (longKeys.length) {
    console.log(`\n[残留] ${f} 仍有 ${longKeys.length} 个长 key:`)
    longKeys.forEach(k => console.log('  ', k.substring(0, 100)))
  }
}
