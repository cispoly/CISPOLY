import { blogs } from '@/lib/data/blogs'
import type { Guideline, Paper } from '@/types'

const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')

// Some publication-to-blog relationships are editorial rather than lexical.
// Keep these explicit so the paper card remains linked to the intended news
// article even when the article title is written from a reader-facing angle.
const relatedBlogOverrides: Record<string, string | null> = {
  '27_joint_methylation_progress': 'pax1-jam3-precision-cervical-screening-pathway',
  '14_esgo_position_screening': 'esgo-releases-new-position-on-cervical',
  '36_ala_pdt_methylation': 'pax1-jam3-methylation-predicts-ala-pdt-efficacy',
  // 以下论文暂无对应博客文章：显式置空，避免关键词自动匹配到不相关博客
  '34_pax1jam3_meta_analysis': null,
  '35_methylation_markers_meta_analysis': null,
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

// ---------- 博客互链：按语义签名匹配同主题文章 ----------

/** 主题词组：同一组的词出现在标题/摘要即视为覆盖该主题 */
const TOPIC_GROUPS: Record<string, string[]> = {
  cervical: ['宫颈癌', '子宫颈', '宫颈', 'HPV', 'cervical', 'HSIL', 'CIN', '阴道镜', 'colposcopy', '下生殖道'],
  endometrial: ['子宫内膜癌', '内膜癌', '异常子宫出血', 'endometrial', '内膜', '宫腔'],
  ovarian: ['卵巢癌', '卵巢', '盆腔肿物', 'ovarian', '盆腔'],
  methylation: ['甲基化', 'methylation', 'PAX1', 'JAM3', 'CDO1', 'CELF4', 'HOXA9', '表观遗传', 'epigenetic'],
  screening: ['筛查', '分流', 'screening', 'triage', 'ASC-US', 'TCT', '早筛', '早诊', '刮宫', '诊断'],
  gyn: ['妇科', '妇产', '妇产科', '妇瘤', 'gynecolog', '红房子', '妇幼'],
  guideline: ['指南', '共识', 'guideline', 'consensus'],
}

function topicSignature(text: string): Set<string> {
  const sig = new Set<string>()
  for (const [topic, kws] of Object.entries(TOPIC_GROUPS)) {
    if (kws.some((k) => text.includes(k))) sig.add(topic)
  }
  return sig
}

/**
 * 返回与给定博客最相关的 N 篇文章（同主题交集最多，其次按时间相近）。
 * 排除自身与节日/公司动态类软文，保证互链的内容相关性。
 */
export function relatedPosts(slug: string, count = 3): { slug: string; title: string; titleEn?: string; date: string }[] {
  const current = blogs.find((b) => b.slug === slug)
  if (!current) return []
  const currentText = `${current.title} ${current.excerpt}`
  const currentSig = topicSignature(currentText)
  if (!currentSig.size) return []

  const isSoftContent = (t: string) => /节日|大吉|开工|快乐|致敬| Holiday |holiday/.test(t)

  const scored = blogs
    .filter((b) => b.slug !== slug && !isSoftContent(`${b.title} ${(b.tags ?? []).join(' ')}`))
    .map((b) => {
      const sig = topicSignature(`${b.title} ${b.excerpt}`)
      const overlap = [...currentSig].filter((t) => sig.has(t)).length
      return { blog: b, overlap }
    })
  // 优先交集>=2 的强相关；不足 count 时用交集 1 的弱相关补足（弱相关仍优于内容孤岛）
  const strong = scored.filter((x) => x.overlap >= 2)
  const weak = scored.filter((x) => x.overlap === 1)
  const picked = [...strong, ...(strong.length >= count ? [] : weak)]
    .sort((a, b) => b.overlap - a.overlap || (b.blog.date || '').localeCompare(a.blog.date || ''))
    .slice(0, count)
  return picked.map(({ blog }) => ({ slug: blog.slug, title: blog.title, titleEn: blog.titleEn, date: blog.date }))
}
