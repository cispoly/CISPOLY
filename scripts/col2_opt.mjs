/**
 * 中列（col 2）布局优化 COL2-OPT
 * 1. 中列最底部面板（非figrow）：压缩到内容最小（flex-grow 0）
 * 2. 中列 figpanel 图片：放宽 max-height（420px），flex 1 1 0 真正填满面板
 * 3. 只处理"中列上两个面板中至少一个非figrow figpanel"的海报
 * 4. figrow 特殊海报（有 !important 覆盖）跳过图片放宽，但底部文字面板仍压缩
 */
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
const require = createRequire('C:/Users/portos/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/x.js')
const { chromium } = require('playwright')
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] })
const ROOT = process.cwd()

async function auditCol2(cancer, id) {
  const page = await browser.newPage({ viewport: { width: 2100, height: 1080 } })
  try {
    const url = 'file://' + path.join(ROOT, 'public/posters', cancer, id, 'poster.html').replace(/\\/g, '/')
    await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(800)
    const d = await page.evaluate(() => {
      const poster = document.querySelector('.poster')
      if (!poster) return null
      poster.style.zoom = '1'
      const cols = Array.from(document.querySelectorAll('.col'))
      const col2 = cols[1]
      if (!col2) return null
      return {
        panels: Array.from(col2.querySelectorAll('.panel')).map((panel, pi) => {
          const r = panel.getBoundingClientRect()
          return {
            idx: pi + 1,
            isFig: panel.classList.contains('figpanel'),
            hasFigrow: !!panel.querySelector('.figrow'),
            h: Math.round(r.height),
            scrollH: panel.scrollHeight,
            imgH: panel.querySelector('img') ? Math.round(panel.querySelector('img').getBoundingClientRect().height) : 0,
            imgMaxLocked: panel.querySelector('img') ? getComputedStyle(panel.querySelector('img')).maxHeight : ''
          }
        })
      }
    })
    await page.close()
    return d
  } catch (e) {
    await page.close()
    return null
  }
}

async function applyCol2(cancer, id, rules) {
  const p = path.join(ROOT, 'public/posters', cancer, id, 'poster.html')
  let t = fs.readFileSync(p, 'utf8')
  t = t.replace(/\/\* ==== COL2-OPT-BEGIN ====[\s\S]*?==== COL2-OPT-END ==== \*\//, '')
  const block = rules.length
    ? `\n  /* ==== COL2-OPT-BEGIN ==== */\n${rules.join('\n')}\n  /* ==== COL2-OPT-END ==== */\n`
    : ''
  t = t.replace('</style>', block + '</style>')
  fs.writeFileSync(p, t)
}

const posters = []
for (const cancer of ['cervical', 'endometrial', 'ovarian']) {
  const dir = path.join(ROOT, 'public/posters', cancer)
  if (!fs.existsSync(dir)) continue
  for (const id of fs.readdirSync(dir)) if (fs.existsSync(path.join(dir, id, 'poster.html'))) posters.push({ cancer, id })
}

const applied = []
const skipped = []
for (const p of posters) {
  const d = await auditCol2(p.cancer, p.id)
  if (!d) { skipped.push({ ...p, reason: 'no col2' }); continue }
  const rules = []
  // 中列上两个面板中是否有非figrow的figpanel
  const topFigs = d.panels.filter(pp => pp.idx <= 2 && pp.isFig && !pp.hasFigrow)
  const hasGrowableFig = topFigs.length > 0
  // 双图海报（第1、2 都是非 figrow figpanel）才应用 COL2-OPT；单图+表格海报保留 POSTER-FIT
  const doubleFig = topFigs.length === 2
  // figrow 特殊海报（中列有 figrow 面板）跳过：有 !important 覆盖，避免冲突
  const hasAnyFigrow = d.panels.some(pp => pp.hasFigrow)
  if (hasAnyFigrow) {
    skipped.push({ ...p, reason: 'figrow poster' })
    await applyCol2(p.cancer, p.id, [])
    continue
  }
  const bottom = d.panels.find(pp => pp.idx === 3)
  const bottomIsFig = bottom && bottom.isFig
  const bottomHasFigrow = bottom && bottom.hasFigrow

  // 放宽中列 figpanel 图片（非 figrow）
  for (const pp of topFigs) {
    rules.push(`.col:nth-child(2) > .panel:nth-child(${pp.idx}) { flex: 1 1 auto; }`)
    rules.push(`.col:nth-child(2) > .panel:nth-child(${pp.idx}) .figwrap img { flex: 1 1 0; max-height: 420px; min-height: 40px; }`)
  }
  // 压缩底部面板（仅双图海报 + 底部普通文字面板时才压缩）
  if (bottom && !bottomHasFigrow && doubleFig && !bottomIsFig) {
    rules.push(`.col:nth-child(2) > .panel:nth-child(3) { flex: 0 1 auto; flex-grow: 0; }`)
  } else if (!doubleFig && hasGrowableFig) {
    // 单图海报：不应用 COL2-OPT（POSTER-FIT 的 flex-basis 锁死图片高度更合适）
    skipped.push({ ...p, reason: 'single fig poster' })
    await applyCol2(p.cancer, p.id, [])
    continue
  } else if (bottomIsFig) {
    // 三图海报：不应用 COL2-OPT（POSTER-FIT 已适配），避免覆盖 flex-basis
    skipped.push({ ...p, reason: 'bottom is fig' })
    await applyCol2(p.cancer, p.id, [])
    continue
  }

  if (rules.length) {
    await applyCol2(p.cancer, p.id, rules)
    applied.push({ ...p, rules: rules.length })
  } else {
    skipped.push({ ...p, reason: hasGrowableFig ? 'no bottom' : 'no growable fig' })
  }
}
await browser.close()

console.log('应用 COL2-OPT 的海报:', applied.length)
for (const a of applied) console.log(`  ${a.cancer}/${a.id} (${a.rules} 条规则)`)
console.log('\n跳过:', skipped.length)
for (const s of skipped) console.log(`  ${s.cancer}/${s.id} (${s.reason})`)
