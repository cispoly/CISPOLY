import paperFields from '@/data/paper-fields-v2.json'
import blogBodiesZh from '@/data/blogs.body.json'
import blogBodiesEn from '@/data/blogs.body.en.json'

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

const normKey = (value: string) => value.replace(/\s+/g, '_')

const stripHtml = (value?: string) =>
  value
    ?.replace(/<sup>([^<]*)<\/sup>/gi, '$1')
    .replace(/<sub>([^<]*)<\/sub>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()

export function getPdfFields(id: string): PdfParsedFields | undefined {
  const all = paperFields as Record<string, PdfParsedFields>
  const fields = all[normKey(id)] || all[id]
  if (!fields) return undefined

  return {
    doi: fields.doi,
    conclusion: stripHtml(fields.conclusion),
    keyData: stripHtml(fields.keyData),
    affiliation: stripHtml(fields.affiliation),
    abstract: stripHtml(fields.abstract),
    title: stripHtml(fields.title),
    figures: fields.figures,
    sections: fields.sections,
  }
}

export function getBlogBody(slug: string, lang: 'zh' | 'en') {
  const zh = blogBodiesZh as Record<string, string>
  const en = blogBodiesEn as Record<string, string>
  return (lang === 'en' ? en[slug] : undefined) || zh[slug] || ''
}
