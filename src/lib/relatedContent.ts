import { blogs } from '@/lib/data/blogs'
import type { Guideline, Paper } from '@/types'

const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')

// Some publication-to-blog relationships are editorial rather than lexical.
// Keep these explicit so the paper card remains linked to the intended news
// article even when the article title is written from a reader-facing angle.
const relatedBlogOverrides: Record<string, string | null> = {
  '27_joint_methylation_progress': 'pax1-jam3-precision-cervical-screening-pathway',
  '14_esgo_position_screening': 'esgo-releases-new-position-on-cervical',
  // 以下论文暂无对应博客文章：显式置空，避免关键词自动匹配到不相关博客
  '34_pax1jam3_meta_analysis': null,
  '35_methylation_markers_meta_analysis': null,
  '36_ala_pdt_methylation': null,
  '37_two_methylation_assays_hrhpv_mrna': null,
  '13_edendx_assay_validation': null,
}

function findRelated(title: string) {
  const titleText = normalize(title)
  const terms = titleText.split(/\s+/).filter((term) => term.length >= 4 && !/^\d+$/.test(term))
  const hanTerms = title.match(/[\u4e00-\u9fff]{3,}/g) ?? []
  const allTerms = [...new Set([...terms, ...hanTerms])]
  if (!allTerms.length) return undefined

  let best: { slug: string; score: number } | undefined
  for (const blog of blogs) {
    const blogText = normalize(`${blog.title} ${blog.excerpt} ${(blog.tags ?? []).join(' ')}`)
    const score = allTerms.reduce((sum, term) => sum + (blogText.includes(normalize(term)) ? 1 : 0), 0)
    if (score >= 2 && (!best || score > best.score)) best = { slug: blog.slug, score }
  }
  return best?.slug
}

export function relatedBlogFor(item: Paper | Guideline) {
  if ('id' in item && item.id in relatedBlogOverrides) return relatedBlogOverrides[item.id] ?? undefined
  return findRelated(item.title)
}
