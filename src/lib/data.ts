import papersData from '@/data/papers.json'
import guidelinesData from '@/data/guidelines.json'
import blogsData from '@/data/blogs.json'
import productsData from '@/data/products.json'
import companyData from '@/data/company.json'
// 英文翻译独立文件（不被 build-data.ts 覆盖）
import companyEnData from '@/data/company.en.json'
import productsEnData from '@/data/products.en.json'
import guidelinesEnData from '@/data/guidelines.en.json'
import papersEnData from '@/data/papers.en.json'
import blogsEnData from '@/data/blogs.en.json'
import type { CancerKey } from '@/types'

// 索引类型：正文已从 JSON 中剥离，按需加载
interface PaperIndex {
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
interface GuidelineIndex {
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
  doi: string | undefined
  citation?: string
  abstractEn?: string
  excerptEn?: string
  cancers?: CancerKey[]
}
interface BlogIndex {
  slug: string
  title: string
  titleEn?: string
  date: string
  dateLabel: string
  lastModified: string
  lastModifiedLabel: string
  cover: string | undefined
  excerpt: string
  excerptEn?: string
  tags: string[]
  tagsEn?: string[]
}
interface Product {
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
  metrics: { label: string; value: string; sub?: string }[]
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
  metricsEn?: { label: string; value: string; sub?: string }[]
  sampleTypeEn?: string
  highlightsEn?: string[]
  hospitalsEn?: string[]
}
interface Company {
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
  stats: { value: string; unit: string; label: string }[]
  qualifications: string[]
  // English fields
  nameEn?: string
  shortNameEn?: string
  missionEn?: string
  descriptionEn?: string
  locationEn?: string
  milestonesEn?: { year: string; text: string }[]
  statsEn?: { value: string; unit: string; label: string }[]
  qualificationsEn?: string[]
}

/*
 * 数据导出：原始中文数据（build-data.ts 从 source/ 生成）与英文翻译（*.en.json 独立维护）合并。
 * 这样 build-data.ts 重新生成原始 JSON 时不会覆盖翻译字段。
 */
const productsEnMap = productsEnData as Record<string, Record<string, unknown>>
const guidelinesEnMap = guidelinesEnData as Record<string, Record<string, unknown>>
const papersEnMap = papersEnData as Record<string, Record<string, unknown>>
const blogsEnMap = blogsEnData as Record<string, Record<string, unknown>>

export const company = { ...companyData, ...companyEnData } as Company
export const products = productsData.map((p) => ({ ...p, ...productsEnMap[p.slug] })) as Product[]
export const guidelines = guidelinesData.map((g) => ({ ...g, ...guidelinesEnMap[g.id] })) as GuidelineIndex[]
export const papers = papersData.map((p) => ({ ...p, ...papersEnMap[p.id] })) as PaperIndex[]
export const blogs = blogsData.map((b) => ({ ...b, ...blogsEnMap[b.slug] })) as BlogIndex[]

export const getProduct = (slug: string) => products.find((p) => p.slug === slug)
export const getPapersByCancer = (cancer: CancerKey) => papers.filter((p) => p.cancer === cancer)
export const getGuidelinesByCancer = (cancer: CancerKey) => guidelines.filter((g) => g.cancer === cancer || (g.cancers?.includes(cancer) ?? false))
export const getPaper = (cancer: CancerKey, id: string) => papers.find((p) => p.cancer === cancer && p.id === id)
export const getGuideline = (cancer: CancerKey, id: string) =>
  guidelines.find((g) => g.cancer === cancer && g.id === id)
export const getBlog = (slug: string) => blogs.find((b) => b.slug === slug)
export const featuredPapers = papers.filter((p) => p.featured)
export const latestBlogs = (n = 6) => blogs.slice(0, n)
export const allTags = [...new Set(blogs.flatMap((b) => b.tags))].sort()

// ---- 正文按需加载（动态 import，避免正文进入首屏 bundle）----
export async function loadPaperBody(id: string): Promise<string> {
  const m = await import('@/data/papers.body.json')
  return (m.default as Record<string, string>)[id] || ''
}
export async function loadGuidelineBody(id: string): Promise<string> {
  const m = await import('@/data/guidelines.body.json')
  return (m.default as Record<string, string>)[id] || ''
}
export async function loadBlogBody(slug: string): Promise<string> {
  const m = await import('@/data/blogs.body.json')
  return (m.default as Record<string, string>)[slug] || ''
}

// ---- PDF 解析字段（paper-fields-v2.json，MinerU 解析产物）----
export interface PdfParsedFields {
  doi?: string
  conclusion?: string
  keyData?: string
  affiliation?: string
  abstract?: string
  title?: string
  figures?: string[]
  sections?: Record<string, string>
}
// 文件名规范化：PDF 文件名（空格）→ md 文件名（下划线）统一为下划线
const normKey = (s: string) => s.replace(/\s+/g, '_')

export async function loadPdfFields(id: string): Promise<PdfParsedFields | undefined> {
  const m = await import('@/data/paper-fields-v2.json')
  const all = m.default as Record<string, PdfParsedFields>
  const f = all[normKey(id)] || all[id] || undefined
  if (!f) return undefined
  // 清理 PDF 解析字段中的 HTML 标签（<sup>m</sup> → m 等），避免详情页显示原始标签
  const stripHtml = (s?: string) =>
    s
      ?.replace(/<sup>([^<]*)<\/sup>/gi, '$1')
      .replace(/<sub>([^<]*)<\/sub>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .trim()
  return {
    doi: f.doi,
    conclusion: stripHtml(f.conclusion),
    keyData: stripHtml(f.keyData),
    affiliation: stripHtml(f.affiliation),
    abstract: stripHtml(f.abstract),
    title: stripHtml(f.title),
    figures: f.figures,
    sections: f.sections,
  }
}

// CANCER_LABEL 已移至 types.ts，这里保持向后兼容导出
export { CANCER_LABEL } from '@/types'
