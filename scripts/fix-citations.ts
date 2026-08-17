/**
 * 引用信息纠正脚本 v2
 * 以 4 个权威 list 为来源：
 *  - source/pdf/academic_published_papers/{CISCER,CISENDO,CISOVA}/cis*_paper_list.md（论文）
 *  - source/clinical_guidelines/guidelines_list.md（指南）
 *
 * 纠正字段：标题 title / 期刊 journal / 年份 year / DOI / 卷 volume / 页 pages
 * 匹配策略：作者+年份 → 标题关键词 → 人工补充
 *
 * 产物：src/data/citations.json
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'source')
const OUT = join(ROOT, 'src', 'data')
mkdirSync(OUT, { recursive: true })

// ---------- 论文引用解析 ----------
interface Citation {
  key: string
  year: number
  journal: string
  volume?: string
  pages?: string
  doi?: string
  title?: string
}

function parseListLine(line: string): Citation | null {
  let l = line.replace(/\r/g, '').trim()
  const numMatch = l.match(/^\d+\.\s+/)
  if (numMatch) l = l.slice(numMatch[0].length)

  let doi = ''
  const doiMatch = l.match(/doi:\s*(10\.\d{4,}\/[^\s"')\]]+)/i)
  if (doiMatch) doi = doiMatch[1].replace(/[.,;]$/, '')

  let year = 0
  const yearMatch = l.match(/\((\d{4})\)/)
  if (yearMatch) year = parseInt(yearMatch[1], 10)
  else {
    const y2 = l.match(/\b(20\d{2})\b/)
    if (y2) year = parseInt(y2[1], 10)
  }

  // 期刊（优先已知刊名模式）
  const journalMatch = l.match(
    /((?:标记免疫分析与临床|国际妇产科学杂志|现代妇产科进展|中华检验医学杂志|兰州大学学报（医学版）|中华医学杂志|中国妇产科临床杂志|中国实用妇科与产科杂志|中国癌症防治杂志|中华保健医学杂志|中国检验检测学会|Clin\s*Epigenetics?\b|BMC\s*(?:Cancer|Women's Health)|Br\s*J\s*Cancer|Int\s*J\s*(?:Cancer|Gynaecol\s*Obstet|Gynecol\s*Cancer)|Intl?\s*Journal\s*of\s*Gynecological\s*Cancer|Cancers?\s*\(Basel\)|Front\.?\s*(?:Oncol|Public\s*Health|Med\.?)|Lab\s*Med|Gynecologic\s*Oncology|Diagnostics|JCO\s*Precis\s*Oncol|The\s*Oncologist|Am\s*J\s*Cancer\s*Res|Sci\s*Rep|Zhong\s*Nan\s*Da\s*Xue\s*Xue\s*Bao|Adv\.?\s*Clin\.?\s*Med\.?|Reproductive\s*and\s*Developmental\s*Medicine|Cytojournal))/
  )
  const journal = journalMatch ? journalMatch[1] : ''

  let volume = ''
  let pages = ''
  const vpMatch = l.match(/(\d{1,3}),\s*([\d–\-]+)/)
  if (vpMatch) {
    volume = vpMatch[1]
    pages = vpMatch[2]
  } else {
    const pMatch = l.match(/([\d–\-]{3,})/)
    if (pMatch && !/^(20\d{2})$/.test(pMatch[1])) pages = pMatch[1]
  }

  // 权威标题：作者之后、期刊之前的完整句
  // 格式: "作者. 标题. 期刊 卷, 页 (年)."
  // 策略：以期刊位置为锚点，反向找作者结束（"et al." / 中文"等" / 机构 & 结尾）
  let title = ''
  if (journal) {
    const jIdx = l.indexOf(journal)
    if (jIdx > 0) {
      let before = l.slice(0, jIdx).trim()
      // 去掉作者部分：从最后一个 "et al." / 中文"等" / "& 机构." 之后开始
      const etAl = before.match(/et\s*al[.,]\s*/i)
      const 等Match = before.match(/等[.,，]\s*/)
      // 机构列表：最后一个 "& xxx." 或 "xxx," 之后
      const ampMatch = before.match(/&\s*[^.]{2,60}\.\s*/)
      const splitAt = etAl ? before.lastIndexOf(etAl[0]) + etAl[0].length : 等Match ? before.lastIndexOf(等Match[0]) + 等Match[0].length : ampMatch ? before.lastIndexOf(ampMatch[0]) + ampMatch[0].length : -1
      if (splitAt > 0) {
        title = before.slice(splitAt).replace(/^[.\s]+/, '').replace(/\.\s*$/, '').trim()
      } else {
        // 无 et al：尝试从最后一个句点+空格后取（英文作者列表格式 "Sun, D., Shu, C., ..."）
        const parts = before.split(/\.\s+/)
        if (parts.length >= 2) {
          title = parts.slice(-3).join('. ').replace(/\.\s*$/, '').trim()
        }
      }
      if (!title) title = before.slice(0, 200)
    }
  }
  if (!title) title = l.slice(0, 200)

  const surname = l.split(/[,\s&]/).filter(Boolean)[0]?.replace(/\d/g, '').toLowerCase() || ''

  if (!year || !journal) return null
  return { key: surname, year, journal, volume, pages, doi, title }
}

function parseListFile(path: string): Citation[] {
  if (!existsSync(path)) return []
  const content = readFileSync(path, 'utf-8')
  const out: Citation[] = []
  for (const line of content.split('\n')) {
    const parsed = parseListLine(line)
    if (parsed) out.push(parsed)
  }
  return out
}

// ---------- 指南引用解析（guidelines_list.md，按癌种分节） ----------
function parseGuidelinesList(path: string): Record<string, Citation[]> {
  const out: Record<string, Citation[]> = { cervical: [], endometrial: [], ovarian: [] }
  if (!existsSync(path)) return out
  let current: 'cervical' | 'endometrial' | 'ovarian' = 'cervical'
  const sectionMap: Record<string, 'cervical' | 'endometrial' | 'ovarian'> = {
    宫颈癌: 'cervical',
    子宫内膜癌: 'endometrial',
    卵巢癌: 'ovarian',
  }
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const trimmed = line.replace(/\r/g, '').trim()
    if (/^##\s*/.test(trimmed)) {
      for (const [key, val] of Object.entries(sectionMap)) {
        if (trimmed.includes(key)) current = val
      }
      continue
    }
    const parsed = parseListLine(trimmed)
    if (parsed) out[current].push(parsed)
  }
  return out
}

// ---------- 人工补充映射（混入目录/特殊文件名） ----------
const MANUAL_PAPER_CITES: Record<string, { journal: string; year: number; doi?: string; volume?: string; pages?: string; title?: string }> = {
  // CISENDO 论文混入 CISCER 目录
  '2_赵行平_et_al_2023_DNA甲基化检测在育龄期异常子宫出血女性子宫内膜癌诊断中的应用价值': {
    journal: '中华检验医学杂志', year: 2023, volume: '46', pages: '367-374',
    title: 'DNA甲基化检测在育龄期异常子宫出血女性子宫内膜癌诊断中的应用价值',
  },
  '3_Bingxin_et_al_2024_The_endometrial_cancer_detection_using_non-invasive_hypermethylation_of_CDO1': {
    journal: 'Cytojournal', year: 2024, volume: '21', pages: '15',
    title: 'The endometrial cancer detection using non-invasive hypermethylation of CDO1 and CELF4 genes in women with postmenopausal bleeding in Northwest China',
  },
  '17_Intl_Journal_of_Cancer_-_2026_-_Peng_-_Reply_to__Comments_on__Enhanced_Diagnostic_Accuracy_of_High‐Grade_Cervical': {
    journal: 'Int J Cancer', year: 2026, doi: '10.1002/ijc.70484',
    title: 'Reply to: Comments on "Enhanced Diagnostic Accuracy of High‐Grade Cervical Intraepithelial Neoplasia in Postmenopausal Women Through PAX1 / JAM3 Methylation Analysis"',
  },
  '25_Intl_Journal_of_Cancer_-_2026_-_Zhong_-_Clinical_Utility_of_Cytological_Methylation_Assay_in_Cervical_Cancer_Screening.docx': {
    journal: 'Int J Cancer', year: 2026,
    title: 'Clinical Utility of Cytological Methylation Assay in Cervical Cancer Screening',
  },
  '3_商晓_et_al_2024_子宫颈细胞学PAX1JAM3双基因甲基化检测用于子宫颈癌筛查的多中心研究': {
    journal: '中华医学杂志 (Zhonghua Yi Xue Za Zhi)', year: 2024, volume: '104', pages: '1852-1859',
    doi: '10.3760/cma.j.cn12137-20231004-00630',
    title: '子宫颈细胞学PAX1/JAM3双基因甲基化检测用于子宫颈癌筛查的多中心研究',
  },
  '5_李翔_et_al_2024_高危型人乳头瘤病毒感染患者宫颈脱落细胞JAM3-PAX1高甲基化诊断宫颈高级别病变': {
    journal: '中南大学学报（医学版）', year: 2023, volume: '48', pages: '1820-1829',
    title: '高危型人乳头瘤病毒感染患者宫颈脱落细胞JAM3-PAX1高甲基化诊断宫颈高级别病变',
  },
  '9_Xiuzhen_Wang_et_al_2026_CDO1_and_CELF4_Methylation_Assay_as_the_Dominant_Predictor_of_Endometrial_Cancer_A_Cohort_Analysis_Across_Pre-_and_Post-Menopausal_Cohorts': {
    journal: 'Gynecologic Oncology', year: 2026, volume: '206', pages: '82-92',
    title: 'CDO1 and CELF4 methylation assay as the dominant predictor of endometrial cancer: A cohort analysis across pre- and post-menopausal cohorts',
  },
  '24_阴道微生态影响宫颈细胞DNA甲基化水平与宫颈病变的相关性研究': {
    journal: '中华检验医学杂志', year: 2024,
    title: '阴道微生态影响宫颈细胞DNA甲基化水平与宫颈病变的相关性研究',
  },
}

function main() {
  console.log('=== 引用纠正 v2 ===')

  const lists: Record<string, Citation[]> = {
    CISCER: parseListFile(join(SRC, 'academic_published_papers', 'ciscer_paper_list.md')),
    CISENDO: parseListFile(join(SRC, 'academic_published_papers', 'cisendo_paper_list.md')),
    CISOVA: parseListFile(join(SRC, 'pdf', 'academic_published_papers', 'CISOVA', 'cisova_paper_list.md')),
  }
  for (const [k, v] of Object.entries(lists)) console.log(`  ${k} list: ${v.length} 条引用`)

  const guidelineLists = parseGuidelinesList(join(SRC, 'clinical_guidelines', 'guidelines_list.md'))
  console.log(`  指南 list: 宫颈癌 ${guidelineLists.cervical.length} / 内膜癌 ${guidelineLists.endometrial.length} / 卵巢癌 ${guidelineLists.ovarian.length}`)

  // 人工补充指南映射（list 关键词匹配失败的边缘案例）
  const MANUAL_GUIDELINE_CITES: Record<string, { journal?: string; year?: number; doi?: string; volume?: string; pages?: string; title?: string }> = {
    '14_European_Society_of_Gynaecological_Oncology_European_Network_of_Gynaecological_Advocacy_Groups_Position_on_risk-based_cervical_cancer_screening': {
      journal: 'Intl Journal of Gynecological Cancer',
      year: 2026,
      volume: '36',
      pages: '104794',
      title: 'European Society of Gynaecological Oncology/European Network of Gynaecological Advocacy Groups Position on risk-based cervical cancer screening',
    },
    '15_【发布稿】《肿瘤DNA甲基化标志物检测技术规范》': {
      journal: '团体标准（中国检验检测学会）',
      year: 2026,
      title: '肿瘤DNA甲基化标志物检测技术规范',
    },
    '12_中国子宫颈癌筛查指南（二）_李明珠': {
      journal: '中国妇产科临床杂志',
      year: 2025,
      volume: '26',
      pages: '88-96',
      title: '中国子宫颈癌筛查指南（二）',
    },
  }

  // 论文匹配（跨目录）
  const allCitations = [...lists.CISCER, ...lists.CISENDO, ...lists.CISOVA]
  const paperCitations: Record<string, { journal: string; year: number; doi?: string; volume?: string; pages?: string; title?: string }> = { ...MANUAL_PAPER_CITES }
  for (const [dir] of Object.entries(lists)) {
    const mdDir = join(SRC, 'academic_published_papers', dir)
    if (!existsSync(mdDir)) continue
    for (const f of readdirSync(mdDir).filter((x) => x.endsWith('.md'))) {
      const name = basename(f, '.md')
      if (paperCitations[name]) continue // 已人工指定

      const surnameMatch = name.match(/^[\d_\-]*([A-Za-z\u4e00-\u9fa5]+)/)
      const yearMatch = name.match(/(20\d{2})/)
      let best: Citation | undefined
      if (surnameMatch && yearMatch) {
        const surname = surnameMatch[1].toLowerCase()
        const year = parseInt(yearMatch[1], 10)
        const matches = allCitations.filter((c) => c.key === surname && Math.abs(c.year - year) <= 2)
        if (matches.length > 0) best = matches.find((c) => c.doi) || matches[0]
      }
      if (!best) {
        const stopEn = new Set(['et', 'al', 'for', 'the', 'with', 'and', 'from', 'methylation', 'detection', 'analysis', 'study', 'women', 'cervical', 'cancer', 'screening', 'gene', 'genes', 'dna', 'using', 'based', 'clinical', 'application', 'assay', 'human', 'pax1', 'jam3', 'cdo1', 'celf4', 'hoxa9'])
        const nameWords = name.toLowerCase().split(/[_\-\s、，。:：]+/).filter((w) => w.length > 3)
        const sigEn = nameWords.filter((w) => !stopEn.has(w))
        const sigZh = name.match(/[\u4e00-\u9fa5]{2,}/g) || []
        best = allCitations.find((c) => {
          const cTitle = (c.title || '').toLowerCase()
          const enHits = sigEn.slice(0, 4).filter((w) => cTitle.includes(w)).length
          const zhHits = sigZh.slice(0, 4).filter((w) => cTitle.includes(w)).length
          return enHits >= 2 || (enHits >= 1 && zhHits >= 1) || zhHits >= 2
        })
      }
      if (best) {
        paperCitations[name] = {
          journal: best.journal,
          year: best.year,
          doi: best.doi || undefined,
          volume: best.volume,
          pages: best.pages,
          title: best.title,
        }
      }
    }
  }
  console.log(`  ✓ 论文引用纠正: ${Object.keys(paperCitations).length} 篇`)

  // 指南匹配（按癌种，从 md 文件名匹配）+ 人工补充
  const guidelineCitations: Record<string, { journal?: string; year?: number; doi?: string; volume?: string; pages?: string; title?: string }> = { ...MANUAL_GUIDELINE_CITES }
  const guideDirs = {
    cervical: 'cervical_cancer_methylation',
    endometrial: 'endometrial_cancer_methylation',
    ovarian: 'ovarian_cancer_methylation',
  } as const
  for (const [cancer, dir] of Object.entries(guideDirs)) {
    const mdDir = join(SRC, 'clinical_guidelines', dir)
    if (!existsSync(mdDir)) continue
    const citations = guidelineLists[cancer as keyof typeof guidelineLists] || []
    for (const f of readdirSync(mdDir).filter((x) => x.endsWith('.md'))) {
      const name = basename(f, '.md')
      if (guidelineCitations[name]) continue // 已人工指定
      // 用标题关键词匹配
      const sigZh = name.replace(/\.md$/, '').match(/[\u4e00-\u9fa5]{2,}/g) || []
      const sigEn = name.toLowerCase().split(/[_\-\s]+/).filter((w) => w.length > 4 && !['methylation', 'cancer', 'cervical', 'consensus', 'experts', 'guideline', 'screening', 'detection'].includes(w))
      const best = citations.find((c) => {
        const cTitle = (c.title || '').toLowerCase()
        const zhHits = sigZh.slice(0, 5).filter((w) => cTitle.includes(w)).length
        const enHits = sigEn.slice(0, 3).filter((w) => cTitle.includes(w)).length
        return zhHits >= 2 || (zhHits >= 1 && enHits >= 1)
      })
      if (best) {
        guidelineCitations[name] = {
          journal: best.journal,
          year: best.year,
          doi: best.doi || undefined,
          volume: best.volume,
          pages: best.pages,
          title: best.title,
        }
      }
    }
  }
  console.log(`  ✓ 指南引用纠正: ${Object.keys(guidelineCitations).length} 篇`)

  writeFileSync(
    join(OUT, 'citations.json'),
    JSON.stringify({ papers: paperCitations, guidelines: guidelineCitations }, null, 2),
    'utf-8',
  )
  console.log(`\n✓ 已写出 src/data/citations.json`)
}

main()
