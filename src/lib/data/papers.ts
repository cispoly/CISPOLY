import papersData from '@/data/papers.json'
import papersEnData from '@/data/papers.en.json'
import type { CancerKey, Paper } from '@/types'

const translations = papersEnData as Record<string, Record<string, unknown>>

export const papers = papersData
  .map((paper) => ({
    ...paper,
    ...translations[paper.id],
  }))
  // Keep the UI order deterministic even when the generated index is stale.
  .sort((a, b) => (b.year || 0) - (a.year || 0)) as Paper[]

export const getPaper = (cancer: CancerKey, id: string) =>
  papers.find((paper) => paper.cancer === cancer && paper.id === id)

export const getPapersByCancer = (cancer: CancerKey) =>
  papers.filter((paper) => paper.cancer === cancer)

export const featuredPapers = papers.filter((paper) => paper.featured)

const EN_JOURNAL_LABELS: Record<string, string> = {
  'Int J Cancer': 'International Journal of Cancer',
  'International Journal of Cancer': 'International Journal of Cancer',
  'American Journal of Cancer Research': 'American Journal of Cancer Research',
  'Laboratory Medicine': 'Laboratory Medicine',
  'European Journal of Cancer': 'European Journal of Cancer',
  'BMC women\'s health': "BMC Women's Health",
  'BMC Women\'s Health': "BMC Women's Health",
  'Frontiers in Medicine': 'Frontiers in Medicine',
  'Frontiers in Oncology': 'Frontiers in Oncology',
  'Frontiers in oncology': 'Frontiers in Oncology',
  'JCO Precision Oncology': 'JCO Precision Oncology',
  Diagnostics: 'Diagnostics',
  'Gynecologic Oncology': 'Gynecologic Oncology',
  'British Journal of Cancer': 'British Journal of Cancer',
  'International Journal of Gynaecology and Obstetrics': 'International Journal of Gynaecology and Obstetrics',
  'Reproductive and Developmental Medicine': 'Reproductive and Developmental Medicine',
  'Scientific Reports': 'Scientific Reports',
  'The Oncologist': 'The Oncologist',
  Cancers: 'Cancers',
  CytoJournal: 'CytoJournal',
  'International Journal of Gynecological Cancer: Official Journal of the International Gynecological Cancer Society': 'International Journal of Gynecological Cancer',
  'Journal of Central South University (Medical Sciences)': 'Journal of Central South University (Medical Sciences)',
  'Zhonghua Yi Xue Za Zhi': 'Chinese Medical Journal',
  '中华检验医学杂志': 'Chinese Journal of Laboratory Medicine',
  '国际妇产科学杂志': 'International Journal of Obstetrics and Gynecology',
  '中文科技期刊数据库（引文版）医药卫生': 'China Science and Technology Journal Database (Citation Edition) — Medicine & Health',
  '标记免疫分析与临床': 'Labeled Immunoassays and Clinical Medicine',
  '现代妇产科进展': 'Progress in Obstetrics and Gynecology',
  '湖南师范大学学报（医学版）': 'Journal of Hunan Normal University (Medical Sciences)',
  '临床医学进展 (Advances in Clinical Medicine)': 'Advances in Clinical Medicine',
  '兰州大学学报（医学版）': 'Journal of Lanzhou University (Medical Sciences)',
  '中华医学杂志': 'Chinese Medical Journal',
}

const containsHan = (value?: string) => Boolean(value && /[\u3400-\u9fff]/.test(value))
const containsReplacementChar = (value?: string) => Boolean(value && value.includes('\uFFFD'))

const getFullEnglishAbstract = (paper: Paper) =>
  [paper.abstractEn, paper.abstract].find(
    (value) => value && !containsHan(value) && !containsReplacementChar(value),
  )

export function getPaperJournal(paper: Paper, lang: 'zh' | 'en') {
  if (lang === 'zh') return paper.journal
  return paper.journalEn || EN_JOURNAL_LABELS[paper.journal] || paper.journal
}

export function getPaperAuthors(paper: Paper, lang: 'zh' | 'en') {
  if (lang === 'zh') return paper.authors
  return paper.authorsEn || (containsHan(paper.authors) ? '' : paper.authors)
}

export function getPaperAbstract(paper: Paper, lang: 'zh' | 'en') {
  if (lang === 'zh') return paper.abstract
  return getFullEnglishAbstract(paper) || ''
}

export function hasFullEnglishAbstract(paper: Paper) {
  return Boolean(getFullEnglishAbstract(paper))
}

export function getPaperCitation(paper: Paper, lang: 'zh' | 'en') {
  if (lang === 'zh') return paper.citation || ''
  return paper.citationEn || (containsHan(paper.citation) ? '' : paper.citation || '')
}
