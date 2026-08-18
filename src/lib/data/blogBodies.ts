import blogBodiesZh from '@/data/blogs.body.json'
import blogBodiesEn from '@/data/blogs.body.en.json'

const zh = blogBodiesZh as Record<string, string>
const en = blogBodiesEn as Record<string, string>

/** Return the localized markdown body for a blog post. */
export function getBlogBody(slug: string, lang: 'zh' | 'en') {
  return (lang === 'en' ? en[slug] : undefined) || zh[slug] || ''
}
