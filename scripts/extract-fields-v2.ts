/**
 * 从 MinerU 解析产物提取字段（DOI/结论/关键数据/单位/摘要）
 * 输入：source/pdf 下各 .paper2anything/poster/ 子目录的 parsed/content.md + figures/
 * 输出：src/data/paper-fields-v2.json（键 = 规范化文件名）
 *
 * 处理 OCR 排版问题：
 * - 合并被空格拆分的词（如 "speci ficity" → "specificity"）
 * - 摘要重构为段落（去换行、去编号碎片）
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs"
import { join, basename, dirname } from "node:path"

const ROOT = process.cwd()
const PDF_ROOT = join(ROOT, 'source', 'pdf')
const OUT = join(ROOT, 'src', 'data')
mkdirSync(OUT, { recursive: true })

// ---------- 工具 ----------
function cleanText(s: string): string {
  return s
    .replace(/ speci ficity/g, ' specificity')
    .replace(/ sens itivity/g, ' sensitivity')
    .replace(/ speciﬁcity/g, ' specificity')
    .replace(/ sensi tivity/g, ' sensitivity')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------- 主流程 ----------
function walkPdfs(dir: string, acc: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walkPdfs(p, acc)
    else if (f.endsWith('.pdf')) acc.push(p)
  }
  return acc
}

const pdfs = walkPdfs(PDF_ROOT)
const out: Record<string, { doi?: string; conclusion?: string; keyData?: string; affiliation?: string; abstract?: string; figures?: string[]; sections?: Record<string, string>; title?: string }> = {}

// Windows 路径长度限制：stem 截断到 70 字符（与 retry-parse.mjs 保持一致）
const shortStem = (s: string) => (s.length > 70 ? s.slice(0, 70) : s)

for (const pdf of pdfs) {
  const stem = basename(pdf, '.pdf')
  // 兼容两种目录：截断后的短 stem（新）与完整 stem（旧 47 个）
  const parsedDirs = [
    join(dirname(pdf), '.paper2anything', 'poster', shortStem(stem), 'parsed'),
    join(dirname(pdf), '.paper2anything', 'poster', stem, 'parsed'),
  ]
  const parsedDir = parsedDirs.find((d) => existsSync(join(d, 'content.md')))
  if (!parsedDir) continue
  const contentPath = join(parsedDir, 'content.md')

  const raw = readFileSync(contentPath, 'utf-8')
  const normKey = stem.replace(/\s+/g, '_')

  // DOI
  let doi = ''
  const doiMatch = raw.match(/doi:\s*(10\.\d{4,}\/[^\s"')\]]+)/i) || raw.match(/https?:\/\/doi\.org\/(10\.\d{4,}\/[^\s"')\]]+)/i)
  if (doiMatch) doi = doiMatch[1].replace(/[.,;]$/, '')

  // 摘要：Abstract 段 或 【摘要】（中文指南），重构为干净段落
  let abstract = ''
  const absMatch =
    raw.match(/##\s*Abstract\s*\n([\s\S]*?)(?=\n##\s|\n#\s|$)/i) ||
    raw.match(/Abstract\s*[:：]\s*([\s\S]*?)(?=\n##\s|\n#\s|$)/i) ||
    raw.match(/【摘要】\s*([\s\S]*?)(?=【关键词】|【Key words】|\n#\s)/)
  if (absMatch) {
    abstract = cleanText(absMatch[1])
      .replace(/\b(Objective|Methods?|Results?|Conclusions?|Background)\b/g, '[$1] ')
      .replace(/^\s*[：:]\s*/, '')
      .slice(0, 800)
  }

  // 单位：<sup>1</sup>Department 行 或 1 Department 行（完整到句号）
  let affiliation = ''
  const affMatch =
    raw.match(/<sup>1<\/sup>(?:Department|Division|Institute|School|Faculty)[^\n]{0,200}/i) ||
    raw.match(/^\s*1\s+(?:Department|Division|Institute|School|Faculty)[^\n]{0,200}/m)
  if (affMatch) {
    affiliation = cleanText(affMatch[0].replace(/<[^>]+>/g, '').replace(/^\s*1\s*/, '')).slice(0, 160)
  } else {
    // 中文单位
    const zhAff = raw.match(/<sup>1<\/sup>[\u4e00-\u9fa5]{2,}(?:医院|大学|医学院|中心)[^\n]{0,120}/)
    if (zhAff) affiliation = cleanText(zhAff[0].replace(/<[^>]+>/g, '')).slice(0, 160)
  }

  // 结论：## Conclusions 章节 / Conclusion: 摘要内
  let conclusion = ''
  const concMatch =
    raw.match(/(?:^|\n)#{1,3}\s*(?:\d+\.?\s*)?Conclusions?\s*[:：]?\s*\n\s*([\s\S]{1,800}?)(?=\n#{1,3}|\n\s*\d+\.\s|\n\n[A-Z][a-z]+\s+[A-Z]|$)/i) ||
    raw.match(/Conclusions?\s*[:：]\s*([^。.\n]{20,}?)(?=\n\s*#|\n\s*\d+\.\s|\nKeywords|\n【)/i)
  if (concMatch) conclusion = cleanText(concMatch[1]).slice(0, 240)

  // 一句话关键数据
  let keyData = ''
  const clean = cleanText(raw)
  const kdMatch =
    clean.match(/[^。.\n;]*(?:灵敏度|特异性|敏感度|特异度|sensitivity|specificity)[^。.\n;]*\d{1,3}\.\d\s*%[^。.\n;]*/i) ||
    clean.match(/[^。.\n;]*\d{1,3}\.\d\s*%[^。.\n;]*(?:灵敏度|特异性|敏感度|特异度|sensitivity|specificity)[^。.\n;]*/i) ||
    clean.match(/[^。.\n;]*\d{2,3}\.\d\s*%[^。.\n;]*/)
  if (kdMatch) keyData = cleanText(kdMatch[0]).slice(0, 160)

  // 标题
  let title = ''
  const h1 = raw.match(/^#\s+(.+)$/m)
  if (h1) title = cleanText(h1[1]).slice(0, 200)

  // poster 三栏内容：背景/方法/结果段落（从 markdown 章节提取）
  const sections: Record<string, string> = {}
  // 常见章节标题映射（全大写兼容）
  const secMap: Array<[RegExp, string]> = [
    [/^#{1,3}\s*(?:\d+\.?\s*)?(?:Background|Introduction)/mi, 'background'],
    [/^#{1,3}\s*(?:\d+\.?\s*)?(?:Methods?|Materials\s+and\s+Methods|方法)/mi, 'methods'],
    [/^#{1,3}\s*(?:\d+\.?\s*)?(?:Results?|结果)/mi, 'results'],
  ]
  // 按行解析：找标题行，取其后到下一个 # 标题或结束
  const lines = raw.split('\n')
  for (const [re, key] of secMap) {
    let startIdx = -1
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) {
        startIdx = i + 1
        break
      }
    }
    if (startIdx < 0) continue
    // 收集内容直到下一个 # 标题；跳过多级子标题（无内容时继续找）
    const content: string[] = []
    for (let i = startIdx; i < lines.length; i++) {
      const l = lines[i]
      if (/^#{1,3}\s/.test(l)) {
        // 已有实质内容则停止；否则跳过（子标题）
        if (content.join(' ').trim().length > 20) break
        continue
      }
      // 跳过图片引用行
      if (/^!\[/.test(l)) continue
      content.push(l)
    }
    const joined = content.join(' ').trim()
    if (joined.length > 20) sections[key] = cleanText(joined).slice(0, 600)
  }

  // 图表清单（figures 文件名）
  const figuresDir = join(parsedDir, 'figures')
  let figures: string[] = []
  if (existsSync(figuresDir)) {
    figures = readdirSync(figuresDir).filter((f) => /\.(png|jpg|jpeg)$/i.test(f)).map((f) => join(figuresDir, f))
  }

  out[normKey] = {
    doi: doi || undefined,
    conclusion: conclusion || undefined,
    keyData: keyData || undefined,
    affiliation: affiliation || undefined,
    abstract: abstract || undefined,
    figures,
    sections,
    title: title || undefined,
  }
}

writeFileSync(join(OUT, 'paper-fields-v2.json'), JSON.stringify(out, null, 2), 'utf-8')
console.log(`✓ 已提取 ${Object.keys(out).length} 篇字段到 src/data/paper-fields-v2.json`)
console.log('  有DOI:', Object.values(out).filter((v) => v.doi).length)
console.log('  有结论:', Object.values(out).filter((v) => v.conclusion).length)
console.log('  有亮点:', Object.values(out).filter((v) => v.keyData).length)
console.log('  有摘要:', Object.values(out).filter((v) => v.abstract).length)
console.log('  有图:', Object.values(out).filter((v) => v.figures && v.figures.length > 0).length)
