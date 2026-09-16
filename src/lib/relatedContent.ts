import { blogs } from '@/lib/data/blogs'
import type { Guideline, Paper } from '@/types'

const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')

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
  return findRelated(item.title)
}
