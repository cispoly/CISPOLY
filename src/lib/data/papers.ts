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
