// 数据类型定义（与 src/data/*.json 对应，构建期生成）

import type { Lang } from '@/lib/i18n'

export interface Paper {
  id: string
  cancer: CancerKey
  cancerLabel: string
  title: string
  titleEn?: string
  authors: string
  journal: string
  year: number | null
  abstract: string
  abstractEn?: string
  excerpt: string
  cover: string | undefined
  body?: string // 正文已剥离到 papers.body.json，按需加载
  doi: string | undefined
  affiliation: string
  affiliationEn?: string
  conclusion: string
  keyData: string
  summary: string
  summaryEn?: string
  featured: boolean
  citation?: string
}

export interface Guideline {
  id: string
  cancer: CancerKey
  cancerLabel: string
  title: string
  titleEn?: string
  publisher: string
  publisherEn?: string
  year: number | null
  abstract: string
  excerpt: string
  cover: string | undefined
  body?: string // 正文已剥离到 guidelines.body.json，按需加载
  doi: string | undefined
  abstractEn?: string
  excerptEn?: string
  cancers?: CancerKey[]
  citation?: string
}

export interface BlogPost {
  slug: string
  title: string
  titleEn?: string
  date: string // YYYY-MM-DD
  dateLabel: string
  lastModified: string // YYYY-MM-DD，默认同 date
  lastModifiedLabel: string
  cover: string | undefined
  coverEn?: string
  excerpt: string
  excerptEn?: string
  tags: string[]
  tagsEn?: string[]
  body?: string // 正文已剥离到 blogs.body.json，按需加载
  bodyEn?: string // 英文正文（按需加载）
  raw?: string
}

export interface ProductMetric {
  label: string
  value: string
  sub?: string
}

export interface Product {
  slug: 'ciscer' | 'cisendo' | 'cisova'
  name: string
  fullName: string
  englishName: string
  cancer: string
  cancerKey: CancerKey
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
  // English fields
  nameEn?: string
  fullNameEn?: string
  cancerEn?: string
  taglineEn?: string
  summaryEn?: string
  targetPopulationEn?: string[]
  scenariosEn?: string[]
  metricsEn?: ProductMetric[]
  sampleTypeEn?: string
  highlightsEn?: string[]
  hospitalsEn?: string[]
}

export interface CompanyStat {
  value: string
  unit: string
  label: string
}

export interface Company {
  name: string
  shortName: string
  english: string
  founded: number
  location: string
  phone: string
  emails: string[]
  mission: string
  description: string
  milestones: { year: string; text: string }[]
  stats: CompanyStat[]
  qualifications: string[]
  // English fields
  nameEn?: string
  shortNameEn?: string
  missionEn?: string
  descriptionEn?: string
  locationEn?: string
  milestonesEn?: { year: string; text: string }[]
  statsEn?: CompanyStat[]
  qualificationsEn?: string[]
}

export type CancerKey = 'cervical' | 'endometrial' | 'ovarian'

/** Bilingual cancer label lookup */
export const CANCER_LABEL: Record<CancerKey, string> = {
  cervical: '子宫颈癌',
  endometrial: '子宫内膜癌',
  ovarian: '卵巢癌',
}

/** Bilingual cancer label by language */
export function getCancerLabel(key: CancerKey, lang: Lang): string {
  const map: Record<CancerKey, { zh: string; en: string }> = {
    cervical: { zh: '宫颈癌', en: 'Cervical Cancer' },
    endometrial: { zh: '子宫内膜癌', en: 'Endometrial Cancer' },
    ovarian: { zh: '卵巢癌', en: 'Ovarian Cancer' },
  }
  return map[key][lang]
}
