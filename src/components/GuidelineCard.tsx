import { Building2, ExternalLink } from 'lucide-react'
import type { Guideline } from '@/types'
import { getCancerLabel } from '@/types'
import { useI18n } from '@/lib/i18n'
import { relatedBlogFor } from '@/lib/relatedContent'
import { Link } from '@/lib/router'
import { guidelineCoverFor } from '@/lib/journalCovers'

function tagsFor(guideline: Guideline, lang: 'zh' | 'en') {
  const text = `${guideline.title} ${guideline.abstract}`.toLowerCase()
  const tags = (guideline.cancers ?? [guideline.cancer]).map((c) => getCancerLabel(c, lang))
  const add = (zh: string, en: string) => tags.push(lang === 'zh' ? zh : en)
  if (/screening|筛查/.test(text)) add('筛查', 'Screening')
  if (/triage|分流/.test(text)) add('分流', 'Triage')
  if (/transformation zone|转化区|tz-?3/.test(text)) add('三型转化区', 'TZ3')
  if (/methylation|甲基化/.test(text)) add('甲基化', 'Methylation')
  return [...new Set(tags)].slice(0, 4)
}

/** 指南卡片沿用博客式横向浏览体验，点击直接进入原始发表平台。 */
export default function GuidelineCard({ guideline }: { guideline: Guideline }) {
  const { lang } = useI18n()
  const title = lang === 'en' && guideline.titleEn ? guideline.titleEn : guideline.title
  const publisher = lang === 'en' && guideline.publisherEn ? guideline.publisherEn : guideline.publisher
  // Resolve the same journal cover in both locales, regardless of translated publisher names.
  const cover = guidelineCoverFor(guideline.id, guideline.publisher)
  const sourceUrl = guideline.externalUrl && (!guideline.externalUrl.includes('mp.weixin.qq.com') || !guideline.doi) ? guideline.externalUrl : undefined
  const href = sourceUrl || (guideline.doi ? `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`${guideline.doi}[doi]`)}` : undefined)
  const relatedBlog = relatedBlogFor(guideline)
  return <div className="card card-hover group relative flex h-[300px] items-stretch overflow-hidden">
    <a href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined} className="flex min-w-0 flex-1 items-stretch">
    <div className="m-3 grid aspect-[3/4] w-24 shrink-0 place-items-center self-center overflow-hidden rounded-lg bg-brand-50 sm:m-4 sm:w-32 md:w-36"><img src={cover || '/images/journal-covers/_journals/journal-placeholder.svg'} alt={`${publisher || 'Guideline'} cover`} className="h-full w-full object-contain p-1 transition duration-300 group-hover:scale-105" loading="lazy" /></div>
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 pb-12 sm:p-5 sm:pb-12">
      <div className="flex items-start justify-between gap-3"><h3 className="break-words text-[14px] font-semibold leading-snug text-ink transition group-hover:text-brand-600 sm:text-[15px]">{title}</h3>{href && <ExternalLink size={15} className="mt-0.5 shrink-0 text-inkSoft/60 group-hover:text-brand-500" />}</div>
      {publisher && <p className="inline-flex items-center gap-1.5 text-xs text-inkSoft"><Building2 size={12} className="text-brand-400" />{lang === 'en' ? 'Affiliation: ' : '发表单位：'}{publisher}</p>}
      {guideline.doi && <p className="font-mono text-[11px] text-brand-600">DOI: {guideline.doi}</p>}
      <div className="flex flex-wrap gap-1.5">{tagsFor(guideline, lang).map((tag) => <span key={tag} className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">{tag}</span>)}</div>
    </div>
    </a>
    {relatedBlog && <Link to={`/blog/${relatedBlog}`} className="absolute bottom-3 right-4 z-10 text-xs font-semibold text-brand-600 underline-offset-2 transition hover:underline">Blog --&gt;</Link>}
  </div>
}
