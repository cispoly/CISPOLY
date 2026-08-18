/**
 * poster_verify.mjs —— 海报几何验证脚本（批量流程用）
 *
 * 用法：node poster_verify.mjs <poster.html路径> [宽] [高]
 *   宽高默认 2100 1080
 *
 * 检查项：
 *   1. 页面溢出（scrollHeight/scrollWidth > 画布）
 *   2. 面板裁剪（面板自然高度 > 面板高度 + 2px）
 *   3. 面板直接子元素垂直重叠（> 1px）
 *   4. 标题栏子元素重叠（排除绝对定位 langswitch）
 *   5. 图片加载 + 宽高比保持（误差 < 0.02）
 *   6. 三列底边对齐（误差 < 3px）
 *
 * 退出码：0 = PASS，1 = FAIL
 */
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// playwright 通过 npx 安装在 npm cache 中；通过 createRequire 定位
const PW_BASE = process.env.PLAYWRIGHT_NODE_MODULES || 'C:/Users/portos/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules'
const require = createRequire(path.join(PW_BASE, 'x.js'))
const { chromium } = require('playwright')

function usage() {
  console.error('用法: node poster_verify.mjs <poster.html路径> [宽] [高]')
  process.exit(2)
}

const htmlPath = process.argv[2]
if (!htmlPath) usage()
const W = parseInt(process.argv[3] || '2100', 10)
const H = parseInt(process.argv[4] || '1080', 10)

const absPath = path.resolve(htmlPath)
const fileUrl = 'file:///' + absPath.replace(/\\/g, '/')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H } })
await page.goto(fileUrl)
await page.waitForTimeout(400)

const result = await page.evaluate(({ canvasW, canvasH }) => {
  const out = { overflow: false, clippedPanels: [], overlaps: [], titlebandOverlaps: [], imageIssues: [], colsAligned: true, errors: [] }

  const poster = document.querySelector('.poster')
  if (!poster) {
    out.errors.push('找不到 .poster 元素')
    return out
  }
  poster.style.zoom = '1'

  // 1. 页面溢出
  if (document.body.scrollHeight > canvasH + 1 || document.body.scrollWidth > canvasW + 1) {
    out.overflow = true
    out.errors.push(`页面溢出 scrollH=${document.body.scrollHeight} scrollW=${document.body.scrollWidth}`)
  }

  // 2. 面板裁剪 + 3. 子元素重叠
  const panels = document.querySelectorAll('.panel')
  panels.forEach((panel, i) => {
    const pr = panel.getBoundingClientRect()
    const orig = panel.style.overflow
    panel.style.overflow = 'visible'
    const naturalH = panel.scrollHeight
    panel.style.overflow = orig
    if (naturalH > pr.height + 2) {
      out.clippedPanels.push({ panel: i + 1, overflow: Math.round(naturalH - pr.height) })
    }
    // 直接子元素重叠
    const children = Array.from(panel.children).filter((c) => c.getBoundingClientRect().height > 0)
    for (let j = 0; j < children.length - 1; j++) {
      const a = children[j].getBoundingClientRect()
      const b = children[j + 1].getBoundingClientRect()
      if (a.bottom > b.top + 1) {
        out.overlaps.push({
          panel: i + 1,
          from: (children[j].tagName + '.' + (children[j].className.split(' ')[0] || '')).slice(0, 30),
          to: (children[j + 1].tagName + '.' + (children[j + 1].className.split(' ')[0] || '')).slice(0, 30),
          vOverlap: Math.round(a.bottom - b.top),
        })
      }
    }
  })

  // 4. 标题栏重叠（排除绝对定位元素）
  const tb = document.querySelector('.titleband')
  if (tb) {
    const tbChildren = Array.from(tb.children).filter((c) => getComputedStyle(c).position !== 'absolute')
    for (let i = 0; i < tbChildren.length - 1; i++) {
      const a = tbChildren[i].getBoundingClientRect()
      const b = tbChildren[i + 1].getBoundingClientRect()
      if (a.bottom > b.top + 1) {
        out.titlebandOverlaps.push({
          from: tbChildren[i].className.split(' ')[0] || tbChildren[i].tagName,
          to: tbChildren[i + 1].className.split(' ')[0] || tbChildren[i + 1].tagName,
          vOverlap: Math.round(a.bottom - b.top),
        })
      }
    }
    // kicker 与 langswitch 水平重叠
    const kicker = tb.querySelector('.kicker')
    const ls = tb.querySelector('.langswitch')
    if (kicker && ls) {
      const range = document.createRange()
      range.selectNodeContents(kicker)
      const kc = range.getBoundingClientRect()
      const lsr = ls.getBoundingClientRect()
      if (kc.right > lsr.left - 2) {
        out.titlebandOverlaps.push({ from: 'kicker-text', to: 'langswitch', vOverlap: 0, note: 'kicker文字与按钮水平重叠' })
      }
    }
  }

  // 5. 图片检查
  document.querySelectorAll('img').forEach((img, i) => {
    if (!img.complete || img.naturalWidth === 0) {
      out.imageIssues.push({ img: i + 1, src: img.src.split('/').pop(), error: '未加载' })
      return
    }
    const r = img.getBoundingClientRect()
    const ratio = r.width / r.height
    const naturalRatio = img.naturalWidth / img.naturalHeight
    // object-fit: contain/cover 时 box 被容器拉伸属预期（内容等比居中），不判定失真
    const objFit = getComputedStyle(img).objectFit
    if (objFit === 'contain' || objFit === 'cover') {
      // 仅当 object-fit 为默认（fill/stretch）且无明确宽高时才判失真
      // contain/cover 保证内容不变形，跳过 box 比例检查
    } else if (Math.abs(ratio - naturalRatio) > 0.02) {
      out.imageIssues.push({ img: i + 1, src: img.src.split('/').pop(), error: `宽高比失真 ${ratio.toFixed(2)} vs ${naturalRatio.toFixed(2)}` })
    }
  })

  // 6. 三列对齐
  const cols = Array.from(document.querySelectorAll('.col')).map((c) => c.getBoundingClientRect().bottom)
  if (cols.length >= 2 && Math.abs(Math.max(...cols) - Math.min(...cols)) > 3) {
    out.colsAligned = false
    out.errors.push(`三列底边不对齐: ${cols.map((c) => Math.round(c)).join(', ')}`)
  }

  return out
}, { canvasW: W, canvasH: H })

await browser.close()

const pass = !result.overflow && result.clippedPanels.length === 0 && result.overlaps.length === 0 &&
  result.titlebandOverlaps.length === 0 && result.imageIssues.length === 0 && result.colsAligned && result.errors.length === 0

console.log(JSON.stringify(result, null, 2))
console.log(pass ? '=== VERIFY PASS ===' : '=== VERIFY FAIL ===')
process.exit(pass ? 0 : 1)
