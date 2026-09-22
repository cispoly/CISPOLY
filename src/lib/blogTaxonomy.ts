import type { BlogPost } from '@/types'

export type BlogCategory =
  | 'research'
  | 'guidelines'
  | 'conferences'
  | 'clinical'
  | 'education'
  | 'company'

export const BLOG_CATEGORY_ORDER: BlogCategory[] = [
  'research',
  'guidelines',
  'conferences',
  'clinical',
  'education',
  'company',
]

const categoryTags: Record<BlogCategory, string[]> = {
  research: ['新文刊发', '多中心研究', '科技成果', '原始创新', 'New Publication', 'Multi-center Study', 'Technology Achievement', 'Original Innovation', 'Clinical Research'],
  guidelines: ['指南', '专家共识', 'Guidelines', 'Expert Consensus', 'Consensus'],
  conferences: ['会议', 'Conference'],
  clinical: ['病例', '分流', '精准筛查', '无创检测', '自采样', 'Case Study', 'Triage', 'Precision Screening', 'Non-invasive Testing', 'Noninvasive Testing', 'Self-Sampling'],
  education: ['科普', 'Education', 'Health Education'],
  company: ['喜讯', '节日', '动态', 'Milestone', 'Holiday', 'Updates'],
}

const categoryLabels: Record<BlogCategory, { zh: string; en: string }> = {
  research: { zh: '研究与论文', en: 'Research & Publications' },
  guidelines: { zh: '指南与共识', en: 'Guidelines & Consensus' },
  conferences: { zh: '学术会议', en: 'Conferences' },
  clinical: { zh: '临床应用', en: 'Clinical Practice' },
  education: { zh: '健康科普', en: 'Health Education' },
  company: { zh: '企业动态', en: 'Company News' },
}

export function blogCategories(blog: Pick<BlogPost, 'tags' | 'tagsEn'>): BlogCategory[] {
  const tags = new Set([...(blog.tags ?? []), ...(blog.tagsEn ?? [])])
  const categories = BLOG_CATEGORY_ORDER.filter((category) =>
    categoryTags[category].some((tag) => tags.has(tag)),
  )

  return categories.length ? categories : ['company']
}

export function blogCategoryLabel(category: BlogCategory, lang: 'zh' | 'en') {
  return categoryLabels[category][lang]
}
