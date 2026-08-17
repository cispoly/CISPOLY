#!/usr/bin/env node
/**
 * 一次性脚本：公众号 markdown 博客图片本地化 + frontmatter 生成
 *
 * 1. 扫描 source/blogs/聚禾生物cispoly/*.md
 * 2. 解析每篇元数据：title（# 标题）、date（正文斜体日期行）、tags（规则推断）、cover
 * 3. 下载全部图片到 source/blogs/聚禾生物cispoly/<slug>/（cover.ext / img-01.ext / …）
 * 4. 正文图片 URL 替换为本地相对路径 ./<slug>/xxx.ext
 * 5. 文件头部插入 YAML frontmatter（title / date / lastModified / tags / cover）
 *
 * 幂等：<slug>/cover.* 已存在则跳过下载；已有 frontmatter 则更新字段不重复插入。
 * 用法：node scripts/blog-localize.mjs            # 正式执行
 *       node scripts/blog-localize.mjs --dry-run  # 仅统计，不下载不写文件
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { join, dirname, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BLOG_DIR = join(ROOT, 'source', 'blogs', '聚禾生物cispoly')

const DRY = process.argv.includes('--dry-run')

// ---------- 工具 ----------
const readMd = (p) => readFileSync(p, 'utf-8').replace(/\r\n/g, '\n')

/** slug：文件名去掉 [日期] 前缀与扩展名，非字母数字/中文/连字符 → - */
function slugFromName(name) {
  return name
    .replace(/^\[[^\]]*\]/, '')
    .replace(/\.md$/, '')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '-')
}

/** 提取正文斜体日期 _2025年02月05日 09:03_ → { iso:'2025-02-05', time:'09:03' } 或 null */
function extractBodyDate(raw) {
  const m = raw.match(/^_(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s+(\d{1,2}):(\d{2}))?_/m)
  if (!m) return null
  const [, y, mo, d, hh, mm] = m
  return {
    iso: `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`,
    time: hh ? `${hh.padStart(2, '0')}:${mm}` : '',
  }
}

/** 文件名 [YYYY-MM-DD-HHMM] → 日期 */
function extractNameDate(name) {
  const m = name.match(/^\[(\d{4})-(\d{2})-(\d{2})-(\d{4})\]/)
  if (!m) return null
  const [, y, mo, d, hm] = m
  return { iso: `${y}-${mo}-${d}`, time: `${hm.slice(0, 2)}:${hm.slice(2)}` }
}

/** 提取所有图片 URL（按出现顺序，保留位置信息用于替换） */
function allImageMatches(md) {
  const out = []
  const re = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g
  let m
  while ((m = re.exec(md))) out.push({ full: m[0], alt: m[1], url: m[2], index: m.index })
  return out
}

/** 扩展名推断：wx_fmt 参数 → Content-Type → 兜底 jpg */
function extFromUrl(url, contentType) {
  const fmt = url.match(/[?&]wx_fmt=([a-z0-9]+)/i)?.[1]
  if (fmt && fmt !== 'other' && /^(jpe?g|png|gif|webp|bmp|svg)$/i.test(fmt)) return fmt === 'jpeg' ? 'jpg' : fmt.toLowerCase()
  const ct = (contentType || '').toLowerCase()
  if (ct.includes('image/png')) return 'png'
  if (ct.includes('image/gif')) return 'gif'
  if (ct.includes('image/webp')) return 'webp'
  if (ct.includes('image/jpeg') || ct.includes('image/jpg')) return 'jpg'
  return 'jpg'
}

// ---------- tag 推断规则（与 build-data.ts 保持一致） ----------
const TAG_RULES = [
  { tag: '新文刊发', match: /新文刊发|新文发表|学术论文|登.*期刊|发表于/ },
  { tag: '专家共识', match: /专家共识|共识发布|共识解读/ },
  { tag: '指南', match: /指南|临床路径|临床应用/ },
  { tag: '会议', match: /大会|论坛|学术会议|研讨会|年会|读片会|交流会|参会|参展/ },
  { tag: '病例', match: /病例|案例分享|临床应用一例/ },
  { tag: '科普', match: /科普|解读系列|你需要检测吗|看懂|别忽视|别让/ },
  { tag: '喜讯', match: /喜讯|重磅|获评|获批|获证|获奖|认证|专精特新|注册证/ },
  { tag: '节日', match: /大吉|快乐|致敬|元宵|开工|劳动节|妇女节|母亲节|护士节|春节|马年|蛇年|新年/ },
  { tag: '多中心研究', match: /多中心|真实世界|招募|启动.*研究/ },
  { tag: '国际', match: /国际|EUROGIN|IPVS|IPVC|全球|国际舞台|马来西亚|瑞典/ },
]
function inferTags(title, body) {
  const text = title + ' ' + body.slice(0, 2000)
  const tags = TAG_RULES.filter((r) => r.match.test(text)).map((r) => r.tag)
  return tags.length ? tags : ['动态']
}

/** YAML 单行值安全序列化 */
function yamlStr(s) {
  const str = String(s ?? '').replace(/\s+/g, ' ').trim()
  if (/^[\w\u4e00-\u9fa5·./()（）-]+$/.test(str) && !/^[-?:]\s/.test(str)) return str
  return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
}

// ---------- 下载（并发控制） ----------
const CONCURRENCY = 6
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Referer: 'https://mp.weixin.qq.com/' },
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const ct = res.headers.get('content-type') || ''
  writeFileSync(dest, buf)
  return { ct, bytes: buf.length }
}

async function runPool(items, worker) {
  const results = new Array(items.length)
  let next = 0
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await worker(items[i], i)
    }
  })
  await Promise.all(runners)
  return results
}

// ---------- 主流程 ----------
async function main() {
  const files = readdirSync(BLOG_DIR).filter((f) => f.toLowerCase().endsWith('.md')).sort()
  console.log(`发现 ${files.length} 篇 markdown\n`)

  const stats = { files: files.length, images: 0, downloaded: 0, skipped: 0, failed: [] }
  const tasks = []

  for (const name of files) {
    const filePath = join(BLOG_DIR, name)
    const raw = readMd(filePath)
    const slug = slugFromName(name)
    const dir = join(BLOG_DIR, slug)
    const images = allImageMatches(raw)

    // 标题：frontmatter 已有则用；否则 # 标题；再否则文件名
    const fmTitle = raw.match(/^---\n([\s\S]*?)\n---/)?.[1]?.match(/^title:\s*(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '')
    const h1 = raw.match(/^#\s+(.+)$/m)
    const title = fmTitle || (h1 ? h1[1].trim() : name.replace(/^\[[^\]]*\]/, '').replace(/\.md$/, ''))

    const bodyDate = extractBodyDate(raw)
    const nameDate = extractNameDate(name)
    const date = bodyDate?.iso || nameDate?.iso || ''
    const time = bodyDate?.time || nameDate?.time || ''
    const tags = inferTags(title, raw)

    // 已有 frontmatter 中读取 date/lastModified/tags/cover（避免覆盖维护值）
    let existing = {}
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/)
    if (fmMatch) {
      const block = fmMatch[1]
      const get = (k) => block.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '')
      const getList = (k) => {
        const m = block.match(new RegExp(`^${k}:\\s*\\[([^\\]]*)\\]`, 'm'))
        if (m) return m[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
        const items = [...block.matchAll(new RegExp(`^\\s*-\\s*(.+)$`, 'gm'))]
        const idx = block.split('\n').findIndex((l) => l.startsWith(`${k}:`))
        if (idx < 0) return []
        const list = []
        for (let i = idx + 1; i < block.split('\n').length; i++) {
          const l = block.split('\n')[i]
          if (!/^\s*-\s+/.test(l)) break
          list.push(l.trim().replace(/^-\s+/, '').replace(/^["']|["']$/g, ''))
        }
        return list
      }
      existing = { title: get('title'), date: get('date'), lastModified: get('lastModified'), tags: getList('tags'), cover: get('cover') }
    }

    const finalTags = existing.tags?.length ? existing.tags : tags
    const lastModified = existing.lastModified || date

    tasks.push({ filePath, name, slug, dir, raw, images, title, date, time, tags: finalTags, lastModified, existingCover: existing.cover })
  }

  // ---------- 阶段 1：统计与下载（仅统计时用 --dry-run） ----------
  for (const t of tasks) {
    // 已本地化判断：封面已下载（任何扩展名）
    const coverCandidates = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.gif', 'cover.webp', 'cover.bmp']
    const coverExists = coverCandidates.some((c) => existsSync(join(t.dir, c)))
    const hasLocalImages = t.images.some((im) => !/^https?:\/\//.test(im.url)) || coverExists
    // 完全处理判断：正文已含本地引用且 frontmatter 已存在 → 整体跳过
    const fullyProcessed = /!\[[^\]]*\]\(\.\//.test(t.raw) && /^---\n/.test(t.raw)

    if (DRY) {
      stats.images += t.images.filter((im) => /^https?:\/\//.test(im.url)).length
      console.log(`[dry] ${t.name}  ${t.images.length} 图  cover=${coverExists ? '已本地' : '远程'}`)
      continue
    }

    // 幂等：完全处理过的直接跳过
    if (fullyProcessed) {
      stats.skipped++
      console.log(`[skip] ${t.name} 已处理`)
      continue
    }

    mkdirSync(t.dir, { recursive: true })

    // 去重 URL → 本地文件名
    const urlToLocal = new Map()
    let imgCount = 0
    for (const im of t.images) {
      if (!/^https?:\/\//.test(im.url)) continue
      if (!urlToLocal.has(im.url)) {
        imgCount++
        urlToLocal.set(im.url, imgCount === 1 ? 'cover' : `img-${String(imgCount - 1).padStart(2, '0')}`)
      }
    }

    // 下载（先探内容类型再定扩展名；单张失败容错，不中断整篇）
    const dlItems = [...urlToLocal.entries()].map(([url, base]) => ({ url, base }))
    await runPool(dlItems, async ({ url, base }) => {
      try {
        const probe = await fetch(url, { headers: { 'User-Agent': UA }, method: 'HEAD', signal: AbortSignal.timeout(20000) }).catch(() => null)
        const ct = probe?.headers.get('content-type') || ''
        const ext = extFromUrl(url, ct)
        const dest = join(t.dir, `${base}.${ext}`)
        if (existsSync(dest)) return { base, ext, skipped: true, bytes: statSync(dest).size }
        const { ct: c2, bytes } = await download(url, dest)
        const ext2 = extFromUrl(url, c2)
        if (ext2 !== ext) {
          const dest2 = join(t.dir, `${base}.${ext2}`)
          if (!existsSync(dest2)) {
            const buf = readFileSync(dest)
            writeFileSync(dest2, buf)
          }
        }
        return { base, ext: ext2, skipped: false, bytes }
      } catch (err) {
        stats.failed.push(`${t.name} → ${base}: ${err.message}`)
        return { base, ext: null, skipped: false, error: true }
      }
    }).then((results) => {
      for (const r of results) {
        if (r.error) continue
        if (r.skipped) stats.skipped++
        else {
          stats.downloaded++
          stats.images++
        }
        if (r.base === 'cover') t.coverExt = r.ext
      }
    })

    // 生成替换映射：URL → ./<slug>/<base>.<ext>（仅替换下载成功的；失败的保留远程 URL）
    const localNames = new Map()
    for (const [url, base] of urlToLocal) {
      // 探测实际扩展名（下载时可能调整）
      const candidates = [base + '.jpg', base + '.jpeg', base + '.png', base + '.gif', base + '.webp', base + '.bmp']
      const found = candidates.find((c) => existsSync(join(t.dir, c)))
      if (found) localNames.set(url, `./${t.slug}/${found}`)
    }
    t.localNames = localNames

    // 正文替换
    let newRaw = t.raw
    const fmMatch = newRaw.match(/^---\n([\s\S]*?)\n---/)
    for (const [url, local] of localNames) {
      newRaw = newRaw.replace(new RegExp(`\\(${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s+"[^"]*")?\\)`, 'g'), `(${local})`)
    }
    // 已存在 frontmatter 时只更新字段；否则插入
    if (fmMatch) {
      // 简化：替换 title/date/lastModified/cover 行，tags 行（存在时替换）
      newRaw = replaceFrontmatterField(newRaw, 'title', yamlStr(t.title))
      newRaw = replaceFrontmatterField(newRaw, 'date', t.date)
      newRaw = replaceFrontmatterField(newRaw, 'lastModified', t.lastModified)
      newRaw = replaceFrontmatterField(newRaw, 'cover', localNames.get(remoteCoverUrl(t.raw)) || t.existingCover || '')
      newRaw = replaceFrontmatterTags(newRaw, t.tags)
    } else {
      const cover = localNames.get(remoteCoverUrl(t.raw)) || ''
      const fm = buildFrontmatter(t.title, t.date, t.lastModified, t.tags, cover)
      newRaw = fm + '\n' + newRaw
    }
    writeFileSync(t.filePath, newRaw, 'utf-8')
    console.log(`[ok] ${t.name}  ${localNames.size} 图 → ${t.slug}/`)
  }

  // ---------- 汇总 ----------
  console.log('\n===== 汇总 =====')
  if (DRY) {
    console.log(`dry-run：共 ${stats.images} 张远程图片待下载（实际以去重后为准）`)
  } else {
    console.log(`处理 ${stats.files} 篇，新下载 ${stats.downloaded} 张，跳过 ${stats.skipped} 项，失败 ${stats.failed.length} 项`)
    if (stats.failed.length) console.log(stats.failed)
  }
}

function remoteCoverUrl(raw) {
  const m = raw.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)/)
  return m ? m[1] : ''
}

function buildFrontmatter(title, date, lastModified, tags, cover) {
  const lines = ['---', `title: ${yamlStr(title)}`, `date: ${date}`, `lastModified: ${lastModified || date}`, 'tags:']
  for (const tg of tags) lines.push(`  - ${yamlStr(tg)}`)
  if (cover) lines.push(`cover: ${yamlStr(cover)}`)
  lines.push('---')
  return lines.join('\n')
}

function replaceFrontmatterField(raw, key, value) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) return raw
  const lines = fm[1].split('\n')
  const idx = lines.findIndex((l) => l.startsWith(`${key}:`))
  if (idx >= 0) lines[idx] = `${key}: ${value}`
  else lines.splice(1, 0, `${key}: ${value}`)
  return raw.replace(fm[0], '---\n' + lines.join('\n') + '\n---')
}

function replaceFrontmatterTags(raw, tags) {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!fm) return raw
  const lines = fm[1].split('\n')
  // 找到 tags: 行，删除其后紧跟的 - item 行，再插入新列表
  const idx = lines.findIndex((l) => l.startsWith('tags:'))
  let out = []
  if (idx >= 0) {
    out = lines.slice(0, idx)
    let i = idx + 1
    while (i < lines.length && /^\s*-\s+/.test(lines[i])) i++
    out = out.concat(lines.slice(i))
    out.splice(idx, 0, 'tags:')
    for (const tg of tags) out.splice(idx + 1, 0, `  - ${yamlStr(tg)}`)
  } else {
    out = lines
    out.splice(1, 0, 'tags:')
    for (const tg of [...tags].reverse()) out.splice(2, 0, `  - ${yamlStr(tg)}`)
  }
  return raw.replace(fm[0], '---\n' + out.join('\n') + '\n---')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
