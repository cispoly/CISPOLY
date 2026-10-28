import type { BlogCategory, BlogPost } from '@/types'

export type { BlogCategory }

/** 分类展示顺序（与 frontmatter category 取值一一对应） */
export const BLOG_CATEGORY_ORDER: BlogCategory[] = [
  'research',
  'guidelines',
  'conferences',
  'clinical',
  'education',
  'company',
]

const categoryLabels: Record<BlogCategory, { zh: string; en: string }> = {
  research: { zh: '研究与论文', en: 'Research & Publications' },
  guidelines: { zh: '指南与共识', en: 'Guidelines & Consensus' },
  conferences: { zh: '学术会议', en: 'Conferences' },
  clinical: { zh: '临床应用', en: 'Clinical Practice' },
  education: { zh: '健康科普', en: 'Health Education' },
  company: { zh: '企业动态', en: 'Company News' },
}

export function isBlogCategory(value: unknown): value is BlogCategory {
  return typeof value === 'string' && value in categoryLabels
}

/**
 * 文章的唯一主分类。分类在 frontmatter 中显式声明，
 * 不参与分类的 `tags` 只作主题关键词使用；非法值回退 company。
 */
export function blogCategory(blog: Pick<BlogPost, 'category'>): BlogCategory {
  return isBlogCategory(blog.category) ? blog.category : 'company'
}

export function blogCategoryLabel(category: BlogCategory, lang: 'zh' | 'en') {
  return categoryLabels[category][lang]
}
