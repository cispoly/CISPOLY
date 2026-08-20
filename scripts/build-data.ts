/**
 * CISPOLY 数据构建管道
 * 扫描 contents/ 目录，解析论文、指南、博客 → 生成 src/data/*.json
 * 后续新增文件即自动收录，零改码。（source/ 为本地原始素材归档，不参与构建）
 *
 * 运行：tsx scripts/build-data.ts
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs'
import { join, basename, extname } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'contents')
const OUT = join(ROOT, 'src', 'data')
mkdirSync(OUT, { recursive: true })

// ---------- 工具 ----------
function readMd(p: string): string {
  return readFileSync(p, 'utf-8').replace(/\r\n/g, '\n')
}

function listMd(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => extname(f).toLowerCase() === '.md' && !f.endsWith('.en.md'))
    .map((f) => join(dir, f))
    .sort()
}

/** 提取 markdown 中第一张图片 URL（用于封面/配图） */
function firstImage(md: string): string | undefined {
  const m = md.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)/)
  return m ? m[1] : undefined
}

/** 提取所有图片 URL */
function allImages(md: string): string[] {
  const out: string[] = []
  const re = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)/g
  let m
  while ((m = re.exec(md))) out.push(m[1])
  return out
}

/** 清洗 markdown 文本为纯文本摘要（去图片、去标记） */
function stripMd(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[(.*?)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`#>|]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 清洗 HTML 标签：保留上标/下标内容（PAX1<sup>m</sup> → PAX1m、epiHERA<sup>®</sup> → epiHERA®），删除其余标签与 markdown 图片 */
function cleanHtml(s: string): string {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<sup>([^<]*)<\/sup>/gi, '$1')
    .replace(/<sub>([^<]*)<\/sub>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s*】#>|]+/, '')
    .trim()
}

/** 从 markdown 提取完整摘要：多级标签回退（Abstract → 中文摘要 → Simple Summary → 结构化标签 → Keywords 前段） */
function extractAbstract(raw: string): string {
  // 终止符：下一标题 / 关键词 / 引用 / 版权 / DOI 链接 / 期刊元数据 / 中文章节 / 表格 / 图片 / 网页残留
  const TERM =
    /\n#|\n\s*\*{0,2}\s*Key\s*words\s*[：:]?\*{0,2}|\nCitation|\n©|https?:\/\/|1\.\s*Background|\nAcademic Editor|\n(?:Received|Revised|Accepted|Published|收稿日期|基金项目|临床试验注册)\s*[:：]|\n\s*\*{0,2}\s*(?:【关键词】|关键词)\s*[:：]?\*{0,2}|\n\||\n!\[|<iframe|chrome-extension/i
  // 各级标签（\n 前缀保证行首；#* 允许有无标题前缀；* 支持 **Abstract** 加粗）
  const LEVELS: RegExp[] = [
    /\n\s*#*\*{0,2}\s*(?:Abstract|A\s*B\s*S\s*T\s*R\s*A\s*C\s*T)\s*[】:：]?\*{0,2}\s*/i,
    /\n\s*#*\*{0,2}\s*(?:【摘\s*要】|摘\s*要)\s*[：:]?\*{0,2}\s*/i,
    /\n\s*#*\s*Simple Summary\s*[：:]?\s*/i,
    /\n\s*#*\s*(?:OBJECTIVES?|Background)\s*[:：]\s*/i,
  ]
  for (const re of LEVELS) {
    const m = re.exec('\n' + raw)
    if (m) {
      const body = raw.slice(m.index + m[0].length - 1)
      const t = TERM.exec(body)
      const txt = t ? body.slice(0, t.index) : body.slice(0, 5000)
      // 质量检查：含网页抓取残留则回退下一级
      const clean = cleanHtml(txt)
      if (clean.length > 50 && !/chrome-extension|iframe|raw\/asserts|识图/i.test(clean)) return txt
    }
  }
  // BMC 风格（无标签）：Keywords 行前最后一段
  const km = /\nKey\s*words[:：]?\s*/i.exec('\n' + raw)
  if (km) {
    const seg = raw.slice(0, km.index).trimEnd()
    const paras = seg.split(/\n\s*\n/)
    return paras[paras.length - 1] ?? ''
  }
  return ''
}

/** 提取中文摘要：**摘要** → **关键词：**（关键词加粗/全角冒号均可终止） */
function extractAbstractZh(raw: string): string {
  const zhRe = /\n\s*#*\*{0,2}\s*(?:【摘\s*要】|摘\s*要)\s*[：:]?\*{0,2}\s*/i
  const m = zhRe.exec('\n' + raw)
  if (!m) return ''
  const body = raw.slice(m.index + m[0].length - 1)
  const TERM_ZH = /\n#|\n\s*\*{0,2}\s*(?:【关键词】|关键词)\s*[:：]?\*{0,2}|\n\||\n!\[|<iframe|chrome-extension/i
  const t = TERM_ZH.exec(body)
  const txt = t ? body.slice(0, t.index) : body.slice(0, 5000)
  const clean = cleanAbstract(txt)
  return clean.length > 50 ? txt : ''
}

/** 摘要清洗：HTML 标签 + markdown 强调符号（*PAX* 1 → PAX 1 → PAX1；*PAX* 1/ *JAM* 3 → PAX1/JAM3） */
function cleanAbstract(s: string): string {
  return cleanHtml(s)
    .replace(/[*_`#>|]/g, '')
    .replace(/\b(PAX|JAM)\s+(\d+)/g, '$1$2')
    .replace(/([A-Za-z0-9])\s*\/\s*(?=[A-Za-z0-9])/g, '$1/')
}

// ---------- 论文解析 ----------
interface Paper {
  id: string
  cancer: 'cervical' | 'endometrial' | 'ovarian'
  cancerLabel: string
  title: string
  authors: string
  journal: string
  year: number | null
  abstract: string
  abstractEn?: string
  excerpt: string
  cover: string | undefined
  body: string
  doi: string | undefined
  affiliation: string
  conclusion: string
  keyData: string
  summary: string
  featured: boolean
}

const CANCER_MAP = {
  CISCER: { key: 'cervical', label: '子宫颈癌' },
  CISENDO: { key: 'endometrial', label: '子宫内膜癌' },
  CISOVA: { key: 'ovarian', label: '卵巢癌' },
} as const

// 每个癌种代表性论文（新短 id 片段匹配），首页精选用
const FEATURED_PAPERS = [
  '4_non1618_triage_multicenter', // CISCER 多中心前瞻性
  '1_pax1jam3_hpv_viral_load', // CISCER
  '7_epihera_prospective', // CISENDO epiHERA
  '5_triage_strategy_biomarkers', // CISENDO
  '1_cdo1_hoxa9_diagnosis', // CISOVA
]

// 清理 DOI：去除 markdown 链接残留（](...）、尾部标点
function cleanDoi(s: string): string {
  return s
    .replace(/\]\(.*$/, '') // markdown 链接残留 ](...
    .replace(/[.,;:)\s'"\]]+$/, '') // 尾部标点
    .trim()
}

function parsePaper(filePath: string, cancerDir: string): Paper {
  const raw = readMd(filePath)
  const name = basename(filePath)
  const meta = CANCER_MAP[cancerDir as keyof typeof CANCER_MAP]
  const id = name.replace(/\.md$/, '')

  // frontmatter 优先：剥离 YAML 头，避免分隔符 `---` 被当作正文
  const { fm, body: bodyAfterFm } = parseFrontmatter(raw)
  const fmTitle = typeof fm.title === 'string' ? fm.title.trim() : ''

  // 标题：frontmatter title → 首个 # 行；否则取首行非空文本
  let title = fmTitle
  if (!title) {
    const h1 = bodyAfterFm.match(/^#\s+(.+)$/m)
    if (h1) title = cleanHtml(h1[1])
  }
  if (!title) {
    const line = bodyAfterFm.split('\n').find((l) => l.trim() && !l.startsWith('!') && !/^https?:/.test(l.trim()))
    title = line ? cleanHtml(stripMd(line)).slice(0, 200) : name
  }

  // 作者：标题后第一个含中文姓名或 et al / 大量逗号的行
  let authors = ''
  const lines = bodyAfterFm.split('\n')
  const titleIdx = lines.findIndex((l) => /^#\s+/.test(l))
  for (let i = titleIdx + 1; i < Math.min(titleIdx + 8, lines.length) && !authors; i++) {
    const l = lines[i].trim()
    if (!l || l.startsWith('!') || l.startsWith('[')) continue
    if (/(et al|等|Department|通信作者|Correspondence|@|http|Citation|EDITED|REVIEWED|RECEIVED|Check for|doi|20\d{2})/i.test(l))
      continue
    if (l.length > 8 && l.length < 300 && /[，,]/.test(l) && /[\u4e00-\u9fa5]{2,}/.test(l)) {
      authors = stripMd(l).replace(/\s*[,，]?\s*△\s*$/, '').slice(0, 200)
      break
    }
  }

  // 期刊：Citation 行或 Front/Oncol|Cancers|IJGO|J Cancer 等关键词
  let journal = ''
  const citMatch = bodyAfterFm.match(/(?:Citation|出处|来源)[:：]?\s*([^\n]+)/i)
  if (citMatch) {
    journal = stripMd(citMatch[1]).slice(0, 120)
  }
  if (!journal) {
    const jMatch = bodyAfterFm.match(/(Front\.[^.\n]+|Cancers|Int\.?\s*J(?:\.\s*Gynecol)?\.?\s*Cancer|J\.?\s*Clin\.?\s*Med|Gynecol\.?\s*Oncol|Clin\s*Epigenetics|IJGO|中华[^\n]{2,15}|检验医学杂志)/)
    if (jMatch) journal = jMatch[1].trim()
  }

  // 年份
  let year: number | null = null
  const yMatch = bodyAfterFm.match(/20(?:2[0-5]|[0-9])\b/)
  if (yMatch) year = parseInt(yMatch[0], 10)

  // 摘要：中英分离 —— 中文摘要（**摘要**）优先作主摘要；仅当源含英文 Abstract 标签时存 abstractEn
  const abstractZhRaw = extractAbstractZh(bodyAfterFm)
  const abstractEnRaw = extractAbstract(bodyAfterFm)
  const hasEnAbstract = /\n\s*#*\*{0,2}\s*(?:Abstract|A\s*B\s*S\s*T\s*R\s*A\s*C\s*T)\s*[】:：]?\*{0,2}\s*/i.test('\n' + bodyAfterFm)
  const abstract = cleanAbstract(abstractZhRaw || abstractEnRaw).slice(0, 6000)
  const abstractEn =
    abstractZhRaw && abstractEnRaw && hasEnAbstract ? cleanAbstract(abstractEnRaw).slice(0, 6000) : undefined

  // 摘要短摘录
  const excerpt = (abstract || stripMd(bodyAfterFm).slice(0, 400)).slice(0, 300)

  // DOI：优先从标题附近（head 区）提取，避免抓到参考文献区的 DOI
  const doiHead = lines.slice(titleIdx, titleIdx + 60).join(' ')
  const doiMatch = doiHead.match(/(10\.\d{4,}\/[^\s)"']+)/)
  const doi = doiMatch ? cleanDoi(doiMatch[1]) : undefined

  // 发表单位：独立行（含或不含编号）Department/Hospital/University 行，或中文 医院/大学 行
  let affiliation = ''
  // 英文：在标题/作者之后 40 行内找 Department/Division/Institute/School/Faculty 行
  const headBlock = lines.slice(titleIdx + 1, titleIdx + 41).join('\n')
  const affEn = headBlock.match(/^\s*(?:\d{1,2}\s+)?(?:Department|Division|Institute|School|Faculty)[^\n]{0,180}/m)
  // 中文：<sup>1</sup>或数字开头 + 医院/大学
  const affZh = headBlock.match(/(?:<sup>1<\/sup>|1)\s*[\u4e00-\u9fa5]{2,}(?:医院|大学|医学院|中心)[^\n]{0,120}/)
  if (affEn) affiliation = stripMd(affEn[0]).replace(/^\d+\s+/, '').slice(0, 160)
  else if (affZh) affiliation = stripMd(affZh[0]).replace(/^[①1]\s*/, '').slice(0, 160)

  // 结论：独立章节 ## Conclusions / ## 5. Conclusions / 摘要内 Conclusions: / "In conclusion, " / 中文 "结论"
  let conclusion = ''
  // 注意：[\s\S]{1,600}? 强制非空（惰性 {0,n} 会匹配空导致 lookahead 失败）
  const concMatch =
    bodyAfterFm.match(/(?:^|\n)#{1,3}\s*(?:\d+\.?\s*)?Conclusions?\s*[:：]?\s*\n\s*([\s\S]{1,800}?)(?=\n#{1,3}|\n\s*\d+\.\s|\n\n[A-Z][a-z]+\s+[A-Z]|$)/i) ||
    bodyAfterFm.match(/(?:^|\n)#{1,3}\s*(?:\d+\.?\s*)?结论\s*[:：]?\s*\n\s*([\s\S]{1,800}?)(?=\n#{1,3}|\n\s*\d+\.\s|\n\n[A-Z]|$)/) ||
    bodyAfterFm.match(/Conclusions?\s*[:：]\s*([^。.\n]{20,}?)(?=\n\s*#|\n\s*\d+\.\s|\nKeywords|\n【)/i) ||
    bodyAfterFm.match(/In conclusion[,，]\s*([^。\n]{20,240})/i) ||
    bodyAfterFm.match(/结论\s*[:：]\s*([^。.\n]{20,}?)(?=\n\s*#|\n\s*\d+\.\s|\n关键词|\n【)/)
  if (concMatch) conclusion = stripMd(concMatch[1]).replace(/^[：:]\s*/, '').slice(0, 220)
  // 兜底：摘要内 "Conclusions:" 同段落（如 "Results: ... Conclusions: ..."）
  if (!conclusion) {
    const absConc = bodyAfterFm.match(/(?:Simple Summary|Abstract|【摘要】)[\s\S]{0,2000}?Conclusions?\s*[:：]\s*([^。.\n]{30,}?)(?=\n|Keywords|\n【|$)/i)
    if (absConc) conclusion = stripMd(absConc[1]).slice(0, 220)
  }

  // 一句话关键数据：优先 %+灵敏度/特异句，其次任意 % 句，最后摘要末句
  let keyData = ''
  const kdMatch =
    bodyAfterFm.match(/[^。.\n;]*(?:灵敏度|特异性|敏感度|特异度|sensitivity|specificity)[^。.\n;]*\d{1,3}\.\d\s*%[^。.\n;]*/i) ||
    bodyAfterFm.match(/[^。.\n;]*\d{1,3}\.\d\s*%[^。.\n;]*(?:灵敏度|特异性|敏感度|特异度|sensitivity|specificity)[^。.\n;]*/i) ||
    bodyAfterFm.match(/[^。.\n;]*\d{2,3}\.\d\s*%[^。.\n;]*/)
  if (kdMatch) keyData = stripMd(kdMatch[0]).slice(0, 140)
  // 兜底：用结论句或摘要末句
  if (!keyData) keyData = (conclusion || abstract.split(/[。.]/).filter(Boolean).pop() || '').slice(0, 140)

  const featured = FEATURED_PAPERS.some((f) => name.includes(f))

  return {
    id,
    cancer: meta.key,
    cancerLabel: meta.label,
    title,
    authors,
    journal,
    year,
    abstract,
    abstractEn,
    excerpt,
    cover: firstImage(bodyAfterFm),
    body: raw,
    doi,
    affiliation,
    conclusion,
    keyData,
    featured,
  }
}

function buildPapers() {
  const papers: Paper[] = []
  for (const [dir, meta] of Object.entries(CANCER_MAP)) {
    const files = listMd(join(SRC, 'academic_published_papers', dir))
    for (const f of files) papers.push(parsePaper(f, dir))
  }

  // 单位补充：旧 PDF 首页提取（paper-affiliations.json），v2 无单位时回退
  const norm = (s: string) => s.replace(/\s+/g, '_').replace(/[｜|]/g, '_')
  const fieldsV2Path = join(OUT, 'paper-fields-v2.json')
  if (existsSync(fieldsV2Path)) {
    const fieldsV2 = JSON.parse(readFileSync(fieldsV2Path, 'utf-8'))
    const v2Index: Record<string, { doi?: string; conclusion?: string; keyData?: string; affiliation?: string; abstract?: string; title?: string }> = {}
    for (const [k, v] of Object.entries(fieldsV2)) v2Index[norm(k)] = v as { doi?: string; conclusion?: string; keyData?: string; affiliation?: string; abstract?: string; title?: string }
    for (const p of papers) {
      const f = v2Index[norm(p.id)]
      if (!f) continue
      // 标题：PDF 解析的更完整则覆盖（仅当明显更长；先清 HTML 标签）
      const vt = cleanHtml(f.title || '')
      if (vt && vt.length > p.title.length - 10) p.title = vt
      // DOI：PDF 解析的覆盖（不含噪声时）
      if (f.doi && !f.doi.includes('caac')) p.doi = f.doi
      // 单位/结论/亮点：PDF 解析优先
      if (f.affiliation) p.affiliation = f.affiliation
      // 摘要：markdown 源已完整提取则保留；仅当源缺失时才回退 PDF 版（也需清标签）
      if (!p.abstract && f.abstract && f.abstract.length > 30) p.abstract = cleanHtml(f.abstract).slice(0, 6000)
      if (f.conclusion && f.conclusion.length > 30) p.conclusion = f.conclusion
      if (f.keyData && f.keyData.length > 20) p.keyData = f.keyData
    }
  }

  // 应用引用纠正（来自 citations.json，以 paper_list.md 为权威）——修正层最后应用，覆盖解析噪声
  const citationsPath = join(OUT, 'citations.json')
  if (existsSync(citationsPath)) {
    const { papers: paperCites } = JSON.parse(readFileSync(citationsPath, 'utf-8'))
    for (const p of papers) {
      const cite = paperCites[p.id]
      if (cite) {
        if (cite.journal) p.journal = cite.journal
        if (cite.year) p.year = cite.year
        // 权威标题覆盖（list 标题为准，若 list 无标题保留原）
        if (cite.title) p.title = cleanHtml(cite.title)
        // DOI 显式覆盖：空字符串清除解析噪声
        if (typeof cite.doi === 'string') p.doi = cite.doi || undefined
        // 单位/摘要/引用串：手工修正覆盖（citations.json 为权威修正层）
        if (cite.affiliation) p.affiliation = cite.affiliation
        if (cite.abstract) p.abstract = cleanHtml(cite.abstract).slice(0, 6000)
        if (cite.conclusion) p.conclusion = cleanHtml(cite.conclusion)
        if (cite.citation) p.citation = cite.citation
      }
      // 全局兜底：清除 caac 前缀的解析噪声 DOI（CA Cancer 期刊不属于本项目）
      if (p.doi && p.doi.includes('caac')) p.doi = undefined
    }
  }

  // 卡片字段净化：conclusion/keyData 从完整摘要重取完整句（旧 PDF 截断字段不用于卡片）
  for (const p of papers) {
    const abs = p.abstract || ''
    const sents = abs.split(/(?<=[.。!?])\s+/).filter(Boolean)
    // conclusion：无 / 非完整句（不以句号结尾）→ 取摘要末句（通常为结论句）
    if (!p.conclusion || !/[.。!?]$/.test(p.conclusion)) {
      p.conclusion = sents.length ? sents[sents.length - 1] : abs
    }
    // keyData：无 / 非完整句 → 优先含 % 的性能句，其次含数字最多的句子
    if (!p.keyData || !/[.。!?%)]$/.test(p.keyData)) {
      let best = sents.length ? sents[sents.length - 1] : abs
      let bestScore = -1
      for (const s of sents) {
        const score = (s.match(/%/g) || []).length * 2 + (s.match(/[0-9０-９]/g) || []).length
        if (score > bestScore) {
          bestScore = score
          best = s
        }
      }
      p.keyData = best
    }
    // 保持完整句（卡片显示层用 line-clamp 控制，数据不截断）
  }

  // 单位补充：旧 PDF 首页提取（paper-affiliations.json），v2 无单位时回退
  const affPath = join(OUT, 'paper-affiliations.json')
  if (existsSync(affPath)) {
    const affs = JSON.parse(readFileSync(affPath, 'utf-8'))
    const affIndex: Record<string, { affiliation: string }> = {}
    for (const [k, v] of Object.entries(affs)) affIndex[norm(k)] = v as { affiliation: string }
    for (const p of papers) {
      if (p.affiliation) continue // v2 已有则不覆盖
      const aff = affIndex[norm(p.id)]
      if (aff && aff.affiliation) p.affiliation = aff.affiliation
    }
  }

  // 结论补充：旧 PDF 首页提取（paper-fields.json），v2 无结论时回退
  const oldFieldsPath = join(OUT, 'paper-fields.json')
  if (existsSync(oldFieldsPath)) {
    const oldFields = JSON.parse(readFileSync(oldFieldsPath, 'utf-8'))
    const oldIndex: Record<string, { conclusion?: string }> = {}
    for (const [k, v] of Object.entries(oldFields)) oldIndex[norm(k)] = v as { conclusion?: string }
    for (const p of papers) {
      if (p.conclusion) continue
      const f = oldIndex[norm(p.id)]
      if (f && f.conclusion && f.conclusion.length > 30) p.conclusion = f.conclusion
    }
  }

  // 引用格式：从引用列表 md 匹配写入 citation 字段（写盘前）
  const citHit = attachCitations(papers) + patchCitations(papers)
  console.log(`  papers citations: ${citHit} 条`)

  // 修正层二次生效：citations.json 显式 doi 清空，覆盖 PDF 解析的噪声 DOI
  const citPath2 = join(OUT, 'citations.json')
  if (existsSync(citPath2)) {
    const { papers: paperCites2 } = JSON.parse(readFileSync(citPath2, 'utf-8'))
    for (const p of papers) {
      const cite2 = paperCites2[p.id]
      if (cite2 && cite2.doi === '') p.doi = undefined
    }
  }

  // CSV 元数据覆盖 + 摘要总结（paper-overrides.json）
  const overridesPath = join(OUT, 'paper-overrides.json')
  if (existsSync(overridesPath)) {
    const overrides: Record<string, Record<string, unknown>> = JSON.parse(readFileSync(overridesPath, 'utf-8'))
    let ovCount = 0
    for (const p of papers) {
      const ov = overrides[p.id]
      if (!ov) continue
      if (ov.title) p.title = ov.title as string
      if (ov.journal) p.journal = ov.journal as string
      if (ov.year) p.year = ov.year as number
      if (ov.doi) p.doi = ov.doi as string
      if (ov.abstract) p.abstract = ov.abstract as string
      if (ov.affiliation) p.affiliation = ov.affiliation as string
      if (ov.summary) p.summary = ov.summary as string
      ovCount++
    }
    console.log(`  paper overrides: ${ovCount} 篇`)
  }

  // 文献列表按发表年份倒序排列，精选标记只用于内容标注，不改变时间顺序。
  papers.sort((a, b) => (b.year || 0) - (a.year || 0))
  // 拆分：列表索引（不含正文）+ 正文映射（按需加载）
  const index = papers.map(({ body, ...rest }) => rest)
  const bodies: Record<string, string> = {}
  for (const p of papers) bodies[p.id] = p.body
  writeJson('papers.json', index)
  writeJson('papers.body.json', bodies)
  console.log(`  papers: ${papers.length} 篇 (精选 ${papers.filter((p) => p.featured).length})`)
  return papers
}

// ---------- 指南解析 ----------
type GuidelineCancer = 'cervical' | 'endometrial' | 'ovarian'
interface Guideline {
  id: string
  cancer: GuidelineCancer
  cancerLabel: string
  title: string
  publisher: string
  year: number | null
  abstract: string
  excerpt: string
  cover: string | undefined
  body: string
  doi: string | undefined
  /** 一份指南同时归属多个癌种（主癌种仍由目录决定，extra 在此登记） */
  cancers?: GuidelineCancer[]
}

const GUIDELINE_DIR_MAP = {
  cervical_cancer_methylation: { key: 'cervical', label: '子宫颈癌' },
  endometrial_cancer_methylation: { key: 'endometrial', label: '子宫内膜癌' },
  ovarian_cancer_methylation: { key: 'ovarian', label: '卵巢癌' },
} as const

/** 多癌种指南：同一份指南同时适用于多个癌种（主癌种由所在目录决定，此处登记额外癌种） */
const GUIDELINE_EXTRA_CANCERS: Record<string, GuidelineCancer[]> = {
  '2_dna_methylation_consensus2024': ['endometrial'],
  '1_methylation_tech_spec': ['cervical'],
}

function parseGuideline(filePath: string, dirKey: string): Guideline {
  const raw = readMd(filePath)
  const name = basename(filePath)
  const id = name.replace(/\.md$/, '')
  const meta = GUIDELINE_DIR_MAP[dirKey as keyof typeof GUIDELINE_DIR_MAP]

  // 去除文件名前缀编号 "12_xxx_" 或 "9_单行本_"
  let title = ''
  const h1 = raw.match(/^#\s+(.+)$/m)
  if (h1) title = cleanHtml(h1[1])
  if (!title) {
    // 从文件名提取
    title = name
      .replace(/^\d+_/, '')
      .replace(/^单行本_/, '')
      .replace(/\.md$/, '')
      .replace(/_/g, ' ')
  }

  // 发布机构：标题后或 DOI 行附近
  let publisher = ''
  const pubMatch = raw.match(/(?:学会|协会|分会|委员会|医学分会|专家组|共识专家组|编委会|中华医学会[^\n]{0,20})/g)
  if (pubMatch) publisher = [...new Set(pubMatch)].slice(0, 2).join('、')

  let year: number | null = null
  const yMatch = raw.match(/20(?:2[0-5]|[0-9])\b/)
  if (yMatch) year = parseInt(yMatch[0], 10)

  // DOI：从标题附近（head 区）提取，避免抓到参考文献区的 DOI
  const titleLineIdx = raw.split('\n').findIndex((l) => /^#\s+/.test(l))
  const headLines = raw.split('\n').slice(Math.max(titleLineIdx, 0), titleLineIdx >= 0 ? titleLineIdx + 60 : 60)
  const doiMatch = headLines.join('\n').match(/DOI[:：]?\s*(10\.\d{4,}\/[^\s)"']+)/i)
  const doi = doiMatch ? cleanDoi(doiMatch[1]) : undefined

  // 摘要：优先【摘要】/ [摘要] 标记行；无标记时跳过元数据/机构/关键词行取首个实质段
  let abstract = ''
  const absMatch = raw.match(/(?:【\s*摘\s*要\s*】|\[摘要\]|摘要[:：])\s*([^\n]+)/)
  if (absMatch) {
    abstract = cleanHtml(absMatch[1]).slice(0, 2000)
  } else {
    const SKIP =
      /^(T\/|2\d{3}|前言|目录|摘要|关键词|Key\s*words|作者[:：]|网络首发|DOI|专家共识DOI|中图分类号|文献标志码|Fund|通信作者|引用格式|题目[:：]|实践指南注册|本文件(按照|由|请注意)|Received|Available online|附录|参考文献|^[A-Z][a-zA-Z’'\-]+(?: [A-Z][a-zA-Z’'\-]+){0,2}<sup>|\.{4,})/
    const ORG = /(分会|委员会|学会|协会|专家组|编委会|起草|提出|发布|实施|归口|基金会|协作组)/
    const lines2 = raw.split('\n')
    let picked = ''
    let pickedIdx = -1
    for (let i = 0; i < lines2.length; i++) {
      const t = lines2[i].trim()
      if (!t || t.startsWith('!') || t.startsWith('#') || SKIP.test(t)) continue
      if (t.length < 30 || /^[0-9０-９]/.test(t) || ORG.test(t) || /^下列/.test(t)) continue
      picked = t
      pickedIdx = i
      break
    }
    if (picked) {
      abstract = cleanHtml(stripMd(picked)).slice(0, 2000)
      // 拼接紧随的内容概述句（最多 2 句；空行/标题跳过）
      const more: string[] = []
      for (const l of lines2.slice(pickedIdx + 1)) {
        const t = l.trim()
        if (!t || t.startsWith('#')) continue
        if (SKIP.test(t) || ORG.test(t) || /^[0-9０-９]/.test(t) || /^下列/.test(t) || t.length < 20 || t.length > 120) break
        more.push(t)
        if (more.length >= 2) break
      }
      if (more.length) abstract = abstract + ' ' + cleanHtml(stripMd(more.join(' '))).slice(0, 2000)
    }
  }

  const extraCancers = GUIDELINE_EXTRA_CANCERS[id]
  return {
    id,
    cancer: meta.key,
    cancerLabel: meta.label,
    title,
    publisher,
    year,
    abstract,
    excerpt: abstract.slice(0, 300) || title,
    cover: firstImage(raw),
    body: raw,
    doi,
    ...(extraCancers ? { cancers: [meta.key, ...extraCancers] } : {}),
  }
}

function buildGuidelines() {
  const items: Guideline[] = []
  for (const dir of Object.keys(GUIDELINE_DIR_MAP)) {
    const files = listMd(join(SRC, 'clinical_guidelines', dir))
    for (const f of files) items.push(parseGuideline(f, dir))
  }

  // 应用 MinerU 完整解析字段（paper-fields-v2.json，PDF 原文解析）
  const normKey = (s: string) => s.replace(/\s+/g, '_').replace(/[｜|]/g, '_')
  const fieldsV2Path = join(OUT, 'paper-fields-v2.json')
  if (existsSync(fieldsV2Path)) {
    const fieldsV2 = JSON.parse(readFileSync(fieldsV2Path, 'utf-8'))
    const v2Index: Record<string, { doi?: string; abstract?: string; title?: string; affiliation?: string }> = {}
    for (const [k, v] of Object.entries(fieldsV2)) v2Index[normKey(k)] = v as { doi?: string; abstract?: string; title?: string; affiliation?: string }
    for (const g of items) {
      const f = v2Index[normKey(g.id)]
      if (!f) continue
      // 标题：PDF 解析的更完整则覆盖（仅当明显更长；先清 HTML 标签）
      const vt = cleanHtml(f.title || '')
      if (vt && vt.length > g.title.length - 10) g.title = vt
      if (f.doi && !f.doi.includes('caac')) g.doi = f.doi
      // 摘要：md 源已完整提取则保留；仅当源缺失时才回退 PDF 版（也需清标签）
      if (!g.abstract && f.abstract && f.abstract.length > 30) g.abstract = cleanHtml(f.abstract).slice(0, 2000)
    }
  }

  // 应用指南 PDF 首页提取的机构（补充 publisher 缺失时）
  const guidPdfPath = join(OUT, 'guideline-pdf-fields.json')
  if (existsSync(guidPdfPath)) {
    const pdfFields = JSON.parse(readFileSync(guidPdfPath, 'utf-8'))
    const idx: Record<string, { publisher?: string; abstract?: string }> = {}
    for (const [k, v] of Object.entries(pdfFields)) idx[normKey(k)] = v as { publisher?: string; abstract?: string }
    for (const g of items) {
      const f = idx[normKey(g.id)]
      if (!f) continue
      // 机构仅在 md 无 publisher 时补充（避免覆盖 list 的期刊名）
      if (f.publisher && !g.publisher) g.publisher = f.publisher
    }
  }

  // 应用指南引用纠正（来自 citations.json 的 guidelines 部分）——修正层最后应用，覆盖解析噪声
  const citationsPath = join(OUT, 'citations.json')
  if (existsSync(citationsPath)) {
    const { guidelines: guidCites } = JSON.parse(readFileSync(citationsPath, 'utf-8'))
    for (const g of items) {
      const cite = guidCites[g.id]
      if (cite) {
        if (cite.journal) g.publisher = cite.journal
        if (cite.year) g.year = cite.year
        if (cite.title) g.title = cleanHtml(cite.title)
        if (typeof cite.doi === 'string') g.doi = cite.doi || undefined
        // 摘要/引用串：手工修正覆盖
        if (cite.abstract) g.abstract = cleanHtml(cite.abstract).slice(0, 2000)
        if (cite.citation) g.citation = cite.citation
      }
    }
  }

  // 引用格式：从引用列表 md 匹配写入 citation 字段（写盘前）
  const citHit = attachCitations(items) + patchCitations(items)
  console.log(`  guidelines citations: ${citHit} 条`)

  items.sort((a, b) => (b.year || 0) - (a.year || 0))
  // 拆分：列表索引（不含正文）+ 正文映射（按需加载）
  const index = items.map(({ body, ...rest }) => rest)
  const bodies: Record<string, string> = {}
  for (const g of items) bodies[g.id] = g.body
  writeJson('guidelines.json', index)
  writeJson('guidelines.body.json', bodies)
  console.log(`  guidelines: ${items.length} 篇`)
  return items
}

// ---------- 博客解析 + 微信公众号清洗 ----------
interface BlogPost {
  slug: string
  title: string
  date: string // YYYY-MM-DD
  dateLabel: string
  lastModified: string // YYYY-MM-DD
  lastModifiedLabel: string
  cover: string | undefined
  excerpt: string
  tags: string[]
  body: string // 已清洗
  raw: string
}

/** 轻量 YAML frontmatter 解析：title / date / lastModified / tags / cover */
function parseFrontmatter(raw: string): { fm: Record<string, unknown>; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return { fm: {}, body: raw }
  const block = m[1]
  const out: Record<string, unknown> = {}
  const lines = block.split('\n')
  let i = 0
  while (i < lines.length) {
    const l = lines[i]
    const kv = l.match(/^([\w-]+):\s*(.*)$/)
    if (!kv) { i++; continue }
    const [, key, val] = kv
    const v = val.trim()
    if (key === 'tags') {
      const tags: string[] = []
      // 内联数组 [a, b]
      const inline = v.match(/^\[(.*)\]$/)
      if (inline && inline[1]) tags.push(...inline[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')))
      // 块级列表
      let j = i + 1
      while (j < lines.length && /^\s+-\s+/.test(lines[j])) {
        tags.push(lines[j].trim().replace(/^-\s+/, '').replace(/^["']|["']$/g, ''))
        j++
      }
      out.tags = tags
      i = j
      continue
    }
    out[key] = v.replace(/^["']|["']$/g, '').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    i++
  }
  return { fm: out, body: raw.slice(m[0].length) }
}

/** 从正文剥离开头重复内容：封面图行、# 标题行、斜体日期行 */
function stripBlogHeader(md: string): string {
  let s = md
  // 封面图（标题前的第一个图片行）
  s = s.replace(/^\s*!\[[^\]]*\]\([^)]*\)\s*\n/, '')
  s = s.replace(/^\s*\n/, '') // 清除残留空行
  // 第一个 # 标题行（兼容 `#标题` 无空格；不匹配 ## 子标题）
  s = s.replace(/^#(?!#)\s*[^\n]*\n?/, '')
  s = s.replace(/^\s*\n/, '')
  // 斜体日期行 _2025年02月05日 09:03_ / _2025年07月03日 09:51_ 广东（要求下划线包裹，避免误伤正文日期开头的段落）
  const dateLine = s.match(/^_(\d{4}年\d{1,2}月\d{1,2}日(?:\s+\d{1,2}:\d{2})?)_[^\n]*\n?/)
  if (dateLine) s = s.slice(dateLine[0].length)
  s = s.replace(/^\s*\n/, '')
  return s.replace(/\n{3,}/g, '\n\n').trim()
}

/** 将正文中相对图片引用复制到 public/blogs/<slug>/，并替换为 /blogs/<slug>/xxx
 * 新引用格式：
 *   ./images/contents/<slug>-img-NN.<ext> → /blogs/<slug>/img-NN.<ext>
 *   ./<slug>/img-NN.<ext（旧结构兼容）→ /blogs/<slug>/img-NN.<ext
 */
function localizeBlogImages(body: string, blogDir: string, slug: string): string {
  const re = /!\[([^\]]*)\]\(\.\/([^)]+)\)/g
  const pubDir = join(ROOT, 'public', 'blogs', slug)
  mkdirSync(pubDir, { recursive: true })
  return body.replace(re, (match, alt, rel) => {
    const src = join(blogDir, rel)
    // 新结构 images/contents/<slug>-img-NN.ext → img-NN.ext；旧结构 <slug>/img-NN.ext → img-NN.ext
    let outName = basename(rel)
    const newImg = rel.match(/images\/contents\/[^/]+-((?:img-)?\d+)\.([\w]+)$/)
    if (newImg) outName = `img-${newImg[1]}.${newImg[2]}`
    if (existsSync(src)) {
      try { copyFileSync(src, join(pubDir, outName)) } catch { /* 忽略复制失败 */ }
    }
    return `![${alt}](/blogs/${slug}/${outName})`
  })
}

// 微信公众号 UI 残留清洗规则
const WECHAT_NOISE_PATTERNS: RegExp[] = [
  /\*+\s*点击[^\n]*关注[^\n]*\**/g,
  /\*+\s*关注聚禾[^\n]*\**/g,
  /点击蓝字[^\n]*/g,
  /长按[^\n]*二维码[^\n]*/g,
  /长按识别[^\n]*/g,
  /阅读原文[^\n]*/g,
  /阅读\s*\d+/g,
  /在小说阅读器读本章[^\n]*/g,
  /去阅读[^\n]*/g,
  /^阅读$/gm,
  /^知道了$/gm,
  /^分享\s*收藏\s*点赞\s*在看/gm,
  /\*+\s*取消\s*允许\s*\*+/g,
  /取消\s*允许/g,
  /允许\*+/g,
  /预览时标签不可点[^\n]*/g,
  /原创\s*聚禾生物cispoly[^\n]*/g,
  /^聚禾生物cispoly\s*$/gm,
  /微信[^\n]*扫一扫[^\n]*/g,
  /关注[^\n]*公众号[^\n]*/g,
  /分享[^\n]*朋友圈[^\n]*/g,
  /分享给[^\n]*微信[^\n]*/g,
  /写下你的留言[^\n]*/g,
  /留言[^\n]*精选[^\n]*/g,
  /赞\s*在看/g,
  /已无更多数据[^\n]*/g,
  /继续访问[^\n]*外链[^\n]*/g,
]

// tag 推断规则
const TAG_RULES: { tag: string; match: RegExp }[] = [
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

function inferTags(title: string, body: string): string[] {
  const text = title + ' ' + body.slice(0, 2000)
  const tags = TAG_RULES.filter((r) => r.match.test(text)).map((r) => r.tag)
  return tags.length ? tags : ['动态']
}

function cleanBlogBody(raw: string): string {
  let out = raw
  for (const re of WECHAT_NOISE_PATTERNS) out = out.replace(re, '')
  // 连续空行压缩
  out = out.replace(/\n{3,}/g, '\n\n')
  // 行首行尾多余空白
  out = out
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim()
  return out
}

function buildBlogs() {
  const blogDir = join(SRC, 'blogs')
  const files = listMd(blogDir).filter((f) => !basename(f).endsWith('.en.md'))
  const posts: BlogPost[] = []

  for (const f of files) {
    const raw = readMd(f)
    const name = basename(f)

    // frontmatter 优先，回退旧逻辑
    const { fm, body: bodyAfterFm } = parseFrontmatter(raw)
    const fmSlug = typeof fm.slug === 'string' ? fm.slug.trim() : ''
    const slug = fmSlug || name.replace(/^\[[^\]]*\]/, '').replace(/\.md$/, '').replace(/[^\w\u4e00-\u9fa5-]/g, '-')
    const fmTitle = typeof fm.title === 'string' ? fm.title.trim() : ''
    const fmDate = typeof fm.date === 'string' ? fm.date.trim() : ''
    const fmLastModified = typeof fm.lastModified === 'string' ? fm.lastModified.trim() : ''
    const fmTags = Array.isArray(fm.tags) ? (fm.tags as string[]).filter(Boolean) : []
    const fmCover = typeof fm.cover === 'string' ? fm.cover.trim() : ''

    // 日期：frontmatter date → 文件名 [YYYY-MM-DD-HHMM]
    const nameDate = name.match(/^\[(\d{4})-(\d{2})-(\d{2})-(\d{4})\]/)
    const date = fmDate || (nameDate ? `${nameDate[1]}-${nameDate[2]}-${nameDate[3]}` : '')
    const dateLabel = date ? date.replace(/-/g, '.') : ''
    const lastModified = fmLastModified || date
    const lastModifiedLabel = lastModified ? lastModified.replace(/-/g, '.') : dateLabel

    // 标题：frontmatter → 首个 # → 文件名
    let title = fmTitle
    if (!title) {
      const h1 = raw.match(/^#\s+(.+)$/m)
      if (h1) title = h1[1].trim()
    }
    if (!title) title = name.replace(/^\[[^\]]*\]/, '').replace(/\.md$/, '').replace(/_/g, ' ')

    const body = cleanBlogBody(bodyAfterFm)
    // 本地化正文图片（./slug/xxx → /blogs/slug/xxx）
    const localized = localizeBlogImages(body, blogDir, slug)
    // 剥离与页头重复的封面图 / # 标题 / 斜体日期行
    const bodyClean = stripBlogHeader(localized)

    // 封面：frontmatter cover → 本地相对路径复制到 public 并换绝对路径；否则正文第一张图
    let cover: string | undefined
    if (fmCover) {
      if (fmCover.startsWith('./') || fmCover.startsWith('.\\')) {
        const src = join(blogDir, fmCover.replace(/^\.\\?\//, ''))
        const pubDir = join(ROOT, 'public', 'blogs', slug)
        mkdirSync(pubDir, { recursive: true })
        // 输出统一命名为 cover.<ext>，保持前端 URL 稳定
        const nm = /^cover\./i.test(basename(fmCover)) ? basename(fmCover) : `cover${extname(fmCover)}`
        if (existsSync(src)) {
          try { copyFileSync(src, join(pubDir, nm)) } catch { /* 忽略 */ }
        }
        cover = `/blogs/${slug}/${nm}`
      } else if (/^https?:\/\//.test(fmCover)) {
        cover = fmCover
      } else {
        cover = fmCover
      }
    } else {
      cover = firstImage(localized)
    }

    const excerpt = stripMd(bodyClean).slice(0, 140).replace(/\n/g, ' ')
    const tags = fmTags.length ? fmTags : inferTags(title, bodyClean)

    posts.push({ slug, title, date, dateLabel, lastModified, lastModifiedLabel, cover, excerpt, tags, body: bodyClean, raw })
  }

  // 按日期降序
  posts.sort((a, b) => (a.date < b.date ? 1 : -1))
  // 拆分：列表索引（不含正文/raw）+ 正文映射（按需加载）
  const index = posts.map(({ body, raw, ...rest }) => rest)
  const bodies: Record<string, string> = {}
  for (const b of posts) bodies[b.slug] = b.body
  writeJson('blogs.json', index)
  writeJson('blogs.body.json', bodies)
  console.log(`  blogs: ${posts.length} 篇`)
  return posts
}

// ---------- 英文博客（同目录 *.en.md，frontmatter: title/tags/excerpt） ----------
function buildBlogsEn(blogDir: string) {
  const enFiles = readdirSync(blogDir)
    .filter((f) => f.endsWith('.en.md'))
    .map((f) => join(blogDir, f))
    .sort()
  const enIndex: Record<string, Partial<{ titleEn: string; tagsEn: string[]; excerptEn: string }>> = {}
  const enBodies: Record<string, string> = {}
  for (const f of enFiles) {
    const name = basename(f)
    const raw = readMd(f)
    const { fm, body } = parseFrontmatter(raw)
    const fmSlug = typeof fm.slug === 'string' ? fm.slug.trim() : ''
    const slug = fmSlug || name.replace(/^\[[^\]]*\]/, '').replace(/\.en\.md$/, '').replace(/[^\w\u4e00-\u9fa5-]/g, '-')
    // 与中文同构：相对图片引用（./images/...）复制到 public 并改写为 /blogs/<slug>/ 绝对路径
    const localized = localizeBlogImages(body, blogDir, slug)
    // 字段缺失时不覆盖（前端回退中文）
    const fields: Partial<{ titleEn: string; tagsEn: string[]; excerptEn: string; coverEn: string }> = {}
    const titleEn = typeof fm.title === 'string' ? fm.title.trim() : ''
    const tagsEn = Array.isArray(fm.tags) ? (fm.tags as string[]).filter(Boolean) : []
    const excerptEn = typeof fm.excerpt === 'string' ? fm.excerpt.trim() : ''
    const fmCoverEn = typeof fm.cover === 'string' ? fm.cover.trim() : ''
    if (titleEn) fields.titleEn = titleEn
    if (tagsEn.length) fields.tagsEn = tagsEn
    if (excerptEn) fields.excerptEn = excerptEn
    if (fmCoverEn) {
      if (fmCoverEn.startsWith('./') || fmCoverEn.startsWith('.\\')) {
        // 与中文 cover 同构：源图复制到 public/blogs/<slug>/cover.<ext>，输出稳定 URL
        const src = join(blogDir, fmCoverEn.replace(/^\.\\?\//, ''))
        const pubDir = join(ROOT, 'public', 'blogs', slug)
        mkdirSync(pubDir, { recursive: true })
        const nm = /^cover\./i.test(basename(fmCoverEn)) ? basename(fmCoverEn) : `cover${extname(fmCoverEn)}`
        if (existsSync(src)) {
          try { copyFileSync(src, join(pubDir, nm)) } catch { /* 忽略 */ }
        }
        fields.coverEn = `/blogs/${slug}/${nm}`
      } else {
        fields.coverEn = fmCoverEn
      }
    }
    if (Object.keys(fields).length) enIndex[slug] = fields
    enBodies[slug] = stripBlogHeader(localized)
  }
  writeJson('blogs.en.json', enIndex)
  writeJson('blogs.body.en.json', enBodies)
  console.log(`  blogs en: ${enFiles.length} 篇`)
}

// ---------- 产品数据（手工结构化，源自 source PDF 解析） ----------
interface ProductMetric {
  label: string
  value: string
  sub?: string
}
interface Product {
  slug: 'ciscer' | 'cisendo' | 'cisova'
  name: string
  fullName: string
  englishName: string
  cancer: string
  cancerKey: 'cervical' | 'endometrial' | 'ovarian'
  genes: string[]
  tagline: string
  summary: string
  targetPopulation: string[]
  scenarios: string[]
  metrics: ProductMetric[]
  sampleType: string
  registration: string
  regDate: string
  highlights: string[]
  hospitals: string[]
  color: string
}

const PRODUCTS: Product[] = [
  {
    slug: 'ciscer',
    name: '禾宫康',
    fullName: '禾宫康 CISCER®',
    englishName: 'CISCER',
    cancer: '宫颈癌',
    cancerKey: 'cervical',
    genes: ['PAX1', 'JAM3'],
    tagline: '双基因甲基化检测，助力宫颈癌防治行动',
    summary: 'PAX1/JAM3 双基因联合检测，宫颈脱落细胞无创采样，精准识别 CIN2+ 高级别病变，助力精准分流。',
    targetPopulation: [
      'HPV 阳性人群的精准分流',
      '宫颈细胞学轻度异常（ASC-US）人群',
      '绝经后女性宫颈癌筛查',
      '宫颈病变治疗前后疗效与复发监测',
    ],
    scenarios: [
      '宫颈癌机会性筛查与人群筛查',
      'HPV 阳性后的阴道镜转诊决策',
      '宫颈高级别病变治疗后的随访管理',
      '体检中心女性健康双筛方案',
    ],
    metrics: [
      { label: '灵敏度（CIN2+）', value: '89.60%', sub: '注册临床试验' },
      { label: '特异性', value: '96.50%', sub: '注册临床试验' },
      { label: '灵敏度（CIN3+）', value: '95.96%', sub: '注册临床试验' },
      { label: '注册临床样本', value: '1,968', sub: '例' },
    ],
    sampleType: '宫颈脱落细胞（无创采样）',
    registration: '国械注准 20233400253',
    regDate: '2023',
    highlights: [
      '双基因（PAX1/JAM3）联合检测，效能更优',
      '万例多中心对例研究数据支持',
      '获多项国内外专家共识与指南推荐',
      '全国多中心真实世界研究持续开展',
    ],
    hospitals: ['北京协和医院', '复旦大学附属妇产科医院', '湘雅三医院', '浙江大学医学院附属妇产科医院'],
    color: '#D74B4A',
  },
  {
    slug: 'cisendo',
    name: '禾蔻安',
    fullName: '禾蔻安 CISENDO®',
    englishName: 'CISENDO',
    cancer: '子宫内膜癌',
    cancerKey: 'endometrial',
    genes: ['CDO1', 'CELF4'],
    tagline: '全球首个无创子宫内膜癌筛查，填补临床空白',
    summary: 'CDO1/CELF4 双基因甲基化，无创采样替代有创活检，全球首个无创内膜癌筛查，填补临床空白。',
    targetPopulation: [
      '异常子宫出血女性',
      '绝经后女性子宫内膜癌筛查',
      '围绝经期女性内膜病变风险评估',
      '拟行宫腔镜检查的高风险女性',
    ],
    scenarios: [
      '子宫内膜癌无创早筛',
      '宫腔镜术前风险分层，减少不必要的有创检查',
      '高危人群的随访与监测',
      '体检中心女性健康筛查方案',
    ],
    metrics: [
      { label: '灵敏度（内膜癌）', value: '94.51%', sub: '注册临床试验' },
      { label: '特异性', value: '94.16%', sub: '注册临床试验' },
      { label: '注册临床样本', value: '4,818', sub: '例' },
      { label: '多中心研究', value: '12,000', sub: '例真实世界' },
    ],
    sampleType: '宫颈脱落细胞（无创采样）',
    registration: '国械注准 20243402610',
    regDate: '2024.12',
    highlights: [
      '全球首个无创子宫内膜癌甲基化检测产品',
      '全球专利、CE 认证、马来西亚注册证',
      '获《子宫内膜癌三级预防策略中国专家共识》推荐',
      '获《子宫内膜癌基因甲基化筛查技术临床应用专家共识》推荐',
    ],
    hospitals: ['北京协和医院', '复旦大学附属妇产科医院', '湘雅三医院', '浙江大学医学院附属妇产科医院'],
    color: '#D74B4A',
  },
  {
    slug: 'cisova',
    name: '禾薇益',
    fullName: '禾薇益 CISOVA®',
    englishName: 'CISOVA',
    cancer: '卵巢癌',
    cancerKey: 'ovarian',
    genes: ['CDO1', 'HOXA9'],
    tagline: '一管外周血，发现早期卵巢癌',
    summary: 'CDO1/HOXA9 双基因甲基化，仅需一管外周血 ctDNA，无创辅助诊断，破解"沉默杀手"早发现难题。',
    targetPopulation: [
      '卵巢囊肿/盆腔肿物女性的良恶性鉴别',
      '卵巢癌高危人群的早期风险评估',
      '绝经前后女性的卵巢健康筛查',
      '疑似卵巢癌患者的辅助诊断',
    ],
    scenarios: [
      '卵巢癌早期无创筛查',
      '盆腔肿物的良恶性分层，辅助手术决策',
      '卵巢癌高危人群随访监测',
      '体检中心女性肿瘤筛查方案',
    ],
    metrics: [
      { label: '灵敏度（卵巢癌）', value: '93.19%', sub: '注册临床试验' },
      { label: '特异性', value: '92.78%', sub: '注册临床试验' },
      { label: '注册临床样本', value: '1,421', sub: '例' },
      { label: '多中心研究', value: '近万', sub: '例真实世界' },
    ],
    sampleType: '外周血游离 DNA（无创采样）',
    registration: '国械注准 20253402443',
    regDate: '2025.12',
    highlights: [
      '国内首个获批上市的卵巢癌甲基化检测产品',
      '仅需一管外周血，依从性极佳',
      '基于 ctDNA 表观遗传检测，无创精准',
      '全球专利、自主知识产权',
    ],
    hospitals: ['北京协和医院', '复旦大学附属肿瘤医院', '复旦大学附属妇产科医院', '湘雅三医院'],
    color: '#C24140',
  },
]

function buildProducts() {
  writeJson('products.json', PRODUCTS)
  console.log(`  products: ${PRODUCTS.length} 个`)
  return PRODUCTS
}

// ---------- 企业信息 ----------
const COMPANY = {
  name: '北京起源聚禾生物科技有限公司',
  shortName: '聚禾生物',
  english: 'CISPOLY',
  founded: 2020,
  location: '北京市大兴区华佗路50号院5号楼4层',
  phone: '+86 010-52208820',
  emails: ['OPBT@cispoly.com', 'wangyishan@cispoly.com'],
  mission: '以创新表观遗传技术，守护女性健康',
  description:
    '北京起源聚禾生物科技有限公司成立于 2020 年，总部位于北京大兴生物医药产业基地，是以创新科技为驱动、以关注健康为宗旨的科技企业。聚禾生物是妇科肿瘤早筛早诊领域的开拓者，作为国家级与中关村认证的高新技术企业，专注于妇女肿瘤和相关疾病的早筛早诊产品以及相关自动化检测设备的研发、生产与销售。',
  milestones: [
    { year: '2020', text: '聚禾生物成立，落户北京大兴生物医药产业基地' },
    { year: '2023', text: '禾宫康 CISCER® 获 NMPA 注册证（国械注准20233400253）' },
    { year: '2024', text: '禾蔻安 CISENDO® 获 NMPA 注册证，全球首个无创内膜癌筛查上市' },
    { year: '2025', text: '禾薇益 CISOVA® 获 NMPA 注册证，国内首个卵巢癌甲基化检测产品上市；获评北京市专精特新中小企业' },
  ],
  stats: [
    { value: '900', unit: '㎡', label: 'GMP 生产车间' },
    { value: '1000', unit: '㎡', label: '研发实验室' },
    { value: '千万', unit: '人次', label: '检测年供应' },
    { value: '8', unit: '项', label: '国内外发明专利' },
    { value: '3', unit: '个', label: 'NMPA 注册产品' },
  ],
  qualifications: [
    '国家级高新技术企业',
    '中关村高新技术企业',
    '北京市专精特新中小企业',
    'ISO 13485 医疗器械质量管理体系',
    '6 项国内发明专利 + 2 项全球发明专利',
    '3 个 III 类医疗器械 NMPA 注册证',
  ],
}

function buildCompany() {
  writeJson('company.json', COMPANY)
  console.log(`  company info ✓`)
  return COMPANY
}

// ---------- 引用格式（citation） ----------
// 权威来源：用户整理的 4 个引用列表 markdown（clippings/.../引用列表.md）
const CITATION_LISTS: { path: string; cancer?: 'cervical' | 'endometrial' | 'ovarian' }[] = [
  { path: join(ROOT, 'contents/citation_lists/宫颈癌文献引用列表.md'), cancer: 'cervical' },
  { path: join(ROOT, 'contents/citation_lists/子宫内膜癌引用列表.md'), cancer: 'endometrial' },
  { path: join(ROOT, 'contents/citation_lists/卵巢癌引用列表.md'), cancer: 'ovarian' },
  { path: join(ROOT, 'contents/citation_lists/指南共识引用列表.md') },
]

/** 归一化标题：去 HTML、统一标点、去空白，用于模糊匹配 */
function normTitle(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .normalize('NFKC')
    .replace(/[‑‐‒–—]/g, '-')
    .replace(/[^\w\u4e00-\u9fff]+/g, '')
    .toLowerCase()
}

/** 解析引用列表 md → [{ title, citation }]（提取每条引用串中的标题部分） */
function parseCitationLists() {
  const out: { title: string; citation: string }[] = []
  for (const { path } of CITATION_LISTS) {
    if (!existsSync(path)) continue
    const text = readFileSync(path, 'utf-8').replace(/\r\n/g, '\n')
    const entries = text.match(/^\s*\d+[\.、]\s*(.+)$/gm) || []
    for (const e of entries) {
      const entry = e.replace(/^\s*\d+[\.、]\s*/, '').trim()
      if (!entry || entry.startsWith('!')) continue
      // 标题 = 去掉作者段后的部分：取第一个「. 」分隔的标题段
      const parts = entry.split('. ')
      let ti = 0
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        const looksAuthor = p.length < 45 && (p.includes(',') || p.includes('&') || /et al/i.test(p) || p.includes('，') || p.includes('等'))
        if (!looksAuthor) { ti = i; break }
      }
      const title = parts.slice(ti).join('. ').split(/\s+\(?\d{4}\)?\s*$/)[0].replace(/\.\s*$/, '')
      if (title.length > 8) out.push({ title, citation: entry })
    }
  }
  return out
}

/** 给论文/指南条目按标题模糊匹配引用串并写入 citation 字段 */
function attachCitations(items: { title: string; citation?: string }[]) {
  const cites = parseCitationLists()
  const byNorm = new Map<string, string>()
  for (const c of cites) byNorm.set(normTitle(c.title), c.citation)
  let hit = 0
  for (const it of items) {
    if (it.citation) continue
    const n = normTitle(it.title)
    if (byNorm.has(n)) { it.citation = byNorm.get(n); hit++; continue }
    // 包含匹配（长标题）
    for (const [k, v] of byNorm) {
      if (n.length > 15 && k.length > 15 && (n.includes(k) || k.includes(n))) { it.citation = v; hit++; break }
    }
  }
  return hit
}

// 标题与引用列表不一致时的显式兜底（id 片段 → 引用串）
const CITATION_PATCHES: Record<string, string> = {
  '18_Effectiveness': 'Fan, G. et al. Effectiveness analysis and clinical application potential exploration of combined detection of PAX1/JAM3 gene methylation in early diagnosis of cervical precancerous lesions. Clin Epigenetics 17, 30 (2025).',
  '25_Intl_Journal_of_Cancer_-_2026_-_Zhong': 'Zhong, X. et al. Clinical utility of cytological methylation assay in cervical cancer screening across various cervical transformation zones. Int J Cancer (2026).',
  '24_阴道微生态': '吴思, 吕卫刚, 赵行平, 马洁稚, 徐大宝, 章迪. 阴道微生态影响宫颈细胞DNA甲基化水平与宫颈病变的相关性研究. 中华检验医学杂志 49, 172–180 (2026).',
  '3_商晓': 'Shang, X. et al. [A multicenter study on the accuracy of PAX1/JAM3 dual genes methylation testing for screening cervical cancer]. Zhonghua Yi Xue Za Zhi 104, 1852–1859 (2024).',
  '5_李翔': 'Li, X. et al. High-grade cervical lesions diagnosed by JAM3/PAX1 methylation in high-risk human papillomavirus-infected patients. Zhong Nan Da Xue Xue Bao Yi Xue Ban 48, 1820–1829 (2023).',
  '27_何倩楠': '何倩楠, 黄子杰 & HE Qian-nan, H. Z. PAX1/JAM3双基因联合甲基化检测在宫颈病变管理中的研究进展. 国际妇产科学杂志 53, 278–284.',
  '30_Li_2026_Preliminary': 'Li, M. et al. Preliminary study on PAX1/JAM3 methylation and HPV viral load in CIN3-like squamous cell carcinoma: Are there differences from CIN3 and early invasive carcinoma? Clin Epigenet https://doi.org/10.1186/s13148-026-02201-1 (2026).',
  '14_European_Society': 'Joura, E., Chatzistamatiou, K., Gultekin, M., Sehouli, J., Toth, I., Toth, R. & European Society of Gynaecological Oncology (ESGO). European Society of Gynaecological Oncology/European Network of Gynaecological Advocacy Groups position on risk-based cervical cancer screening. Int J Gynecol Cancer (2026).',
  '12_中国子宫颈癌筛查指南（二）': '中国优生科学协会阴道镜和宫颈病理学分会, 中华医学会妇科肿瘤学分会, 中国抗癌协会宫颈癌专业委员会, 中国医疗保健国际交流促进会妇产健康医学分会, 中国癌症基金会全国宫颈癌防治协作组, 中华预防医学会肿瘤预防与控制专业委员会, 中国妇幼健康研究会宫颈癌防控研究专业委员会. 中国子宫颈癌筛查指南（二）. 中国妇产科临床杂志 26, 88–96 (2025).',
  '3_中国子宫颈癌筛查指南（一）': '中国优生科学协会阴道镜和子宫颈病理学分会 et al. 中国子宫颈癌筛查指南（一）. 中国妇产科临床杂志 24, 437–442 (2023).',
}

/** 显式补丁：按 id 片段匹配（在模糊匹配后兜底） */
function patchCitations(items: { id: string; citation?: string }[]) {
  let hit = 0
  for (const it of items) {
    if (it.citation) continue
    for (const [frag, cite] of Object.entries(CITATION_PATCHES)) {
      if (it.id.includes(frag)) { it.citation = cite; hit++; break }
    }
  }
  return hit
}

// ---------- 写出 ----------
function writeJson(name: string, data: unknown) {
  writeFileSync(join(OUT, name), JSON.stringify(data, null, 2), 'utf-8')
}

// ---------- 主流程 ----------
console.log('CISPOLY 数据构建中…')
const papers = buildPapers()
const guidelines = buildGuidelines()
const blogs = buildBlogs()
buildBlogsEn(join(SRC, 'blogs'))
const products = buildProducts()
const company = buildCompany()

writeJson('index.json', {
  generatedAt: new Date().toISOString(),
  counts: { papers: papers.length, guidelines: guidelines.length, blogs: blogs.length, products: products.length },
})

console.log(`\n✓ 数据已生成到 src/data/`)
