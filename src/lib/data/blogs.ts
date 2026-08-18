import blogsData from '@/data/blogs.json'
import blogsEnData from '@/data/blogs.en.json'
import type { BlogPost } from '@/types'

const translations = blogsEnData as Record<string, Record<string, unknown>>

export const blogs = blogsData.map((post) => ({
  ...post,
  ...translations[post.slug],
})) as BlogPost[]

export const getBlog = (slug: string) => blogs.find((post) => post.slug === slug)
export const latestBlogs = (count = 6) => blogs.slice(0, count)
export const allTags = [...new Set(blogs.flatMap((post) => post.tags))].sort()
