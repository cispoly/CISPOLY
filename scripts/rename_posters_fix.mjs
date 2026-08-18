/**
 * 补充修复：data JSON 中的变体 id（空格版/截断版/破折号版）→ 新短 id
 * 用法: node scripts/rename_posters_fix.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const mapFile = path.join(ROOT, 'scripts/rename_map.json')
const raw = JSON.parse(fs.readFileSync(mapFile, 'utf8'))

// 构建: 变体 id → 新 id
const variantMap = new Map()

function addVariant(oldId, newId) {
  // 原下划线版
  variantMap.set(oldId, newId)
  // 空格版 (paper-affiliations 格式): _ → ' ' 且去掉多余
  const spaceVersion = oldId.replace(/_+/g, ' ')
  variantMap.set(spaceVersion, newId)
  // 空格+尾部空格
  variantMap.set(spaceVersion.trim(), newId)
  // 旧版带尾下划线/空格
  variantMap.set(oldId.replace(/_$/, ''), newId)
  variantMap.set(oldId.replace(/ $/, ''), newId)
}

for (const kind of ['papers', 'guidelines']) {
  for (const [cancer, items] of Object.entries(raw[kind])) {
    for (const [oldId, newId] of Object.entries(items)) {
      addVariant(oldId, newId)
    }
  }
}

// 特殊变体（手工补充）：
// paper-fields-v2 中的破折号变体
variantMap.set('13-Yang_等_2025_Focused_ultrasound_ablation_for_women_with_cervical_lesions-Protocol_of_a_randomized', '13_fus_rct_protocol')
variantMap.set('13-Yang 等 2025_Focused ultrasound ablation for women with cervical lesions-Protocol of a randomized', '13_fus_rct_protocol')
// 17 单下划线变体
variantMap.set('17_Intl_Journal_of_Cancer_-_2026_-_Peng_-_Reply_to_Comments_on_Enhanced_Diagnostic_Accuracy_of_High‐Grade_Cervical', '17_reply_comments')
variantMap.set('17_Intl Journal of Cancer - 2026 - Peng - Reply to  Comments on  Enhanced Diagnostic Accuracy of High‐Grade Cervical', '17_reply_comments')
// 5_Qi 截断版
variantMap.set('5_Qi_et_al_2023_Hypermethylated_CDO1_and_CELF4_in_cytological_specimens_as_triage_strategy', '5_triage_strategy_biomarkers')
variantMap.set('5_Qi et al_2023_Hypermethylated CDO1 and CELF4 in cytological specimens as triage strategy', '5_triage_strategy_biomarkers')

// 也把新 id 本身加入映射（幂等，避免二次误替换）
for (const v of [...variantMap.values()]) variantMap.set(v, v)

console.log('变体映射数量:', variantMap.size)

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
  let count = 0
  for (const [variant, newId] of variantMap) {
    if (variant === newId) continue
    if (newText.includes(variant)) {
      newText = newText.split(variant).join(newId)
      count++
    }
  }
  if (count > 0) {
    fs.writeFileSync(p, newText)
    console.log(`patched ${f}: ${count} 处变体替换`)
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
    longKeys.slice(0, 5).forEach(k => console.log('  ', k.substring(0, 90)))
  }
}
