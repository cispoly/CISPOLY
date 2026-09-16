import { Building2, ExternalLink } from 'lucide-react'
import type { Paper } from '@/types'
import { getCancerLabel } from '@/types'
import { useI18n } from '@/lib/i18n'
import { getPaperJournal } from '@/lib/data/papers'
import { relatedBlogFor } from '@/lib/relatedContent'
import { Link } from '@/lib/router'
import { paperCoverFor } from '@/lib/journalCovers'

function tagsFor(paper: Paper, lang: 'zh' | 'en') {
  const text = `${paper.title} ${paper.abstract}`.toLowerCase()
  const tags = [getCancerLabel(paper.cancer, lang)]
  const add = (zh: string, en: string) => tags.push(lang === 'zh' ? zh : en)
  if (/screening|筛查/.test(text)) add('筛查', 'Screening')
  if (/triage|分流/.test(text)) add('分流', 'Triage')
  if (/transformation zone|转化区|tz-?3/.test(text)) add('三型转化区', 'TZ3')
  if (/early (detection|diagnosis)|早期(发现|诊断)/.test(text)) add('早期发现', 'Early detection')
  if (/methylation|甲基化/.test(text)) add('甲基化', 'Methylation')
  return tags.slice(0, 4)
}

/** 研究卡片采用与博客一致的横向信息布局，仅保留发表元数据与标签。 */
export default function PaperCard({ paper }: { paper: Paper }) {
  const { lang } = useI18n()
  const title = lang === 'en' && paper.titleEn ? paper.titleEn : paper.title
  const journal = getPaperJournal(paper, lang)
  const affiliation = lang === 'en' && paper.affiliationEn ? paper.affiliationEn : paper.affiliation
  const sourceUrl = paper.externalUrl && (!paper.externalUrl.includes('mp.weixin.qq.com') || !paper.doi) ? paper.externalUrl : undefined
  const href = sourceUrl || (paper.doi ? `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(`${paper.doi}[doi]`)}` : undefined)
  const relatedBlog = relatedBlogFor(paper)
  return <div className="card card-hover group relative flex h-[300px] items-stretch overflow-hidden">
    <a href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener noreferrer' : undefined} className="flex min-w-0 flex-1 items-stretch">
    <div className="m-3 grid aspect-[3/4] w-24 shrink-0 place-items-center self-center overflow-hidden rounded-lg bg-brand-50 sm:m-4 sm:w-32 md:w-36"><img src={paperCoverFor(paper.id, journal) || '/images/journal-covers/_journals/journal-placeholder.svg'} alt={`${journal || 'Journal'} cover`} className="h-full w-full object-contain p-1 transition duration-300 group-hover:scale-105" loading="lazy" /></div>
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 pb-12 sm:p-5 sm:pb-12">
      <div className="flex items-start justify-between gap-3"><h3 className="break-words text-[14px] font-semibold leading-snug text-ink transition group-hover:text-brand-600 sm:text-[15px]">{title}</h3>{href && <ExternalLink size={15} className="mt-0.5 shrink-0 text-inkSoft/60 group-hover:text-brand-500" />}</div>
      {journal && <p className="text-xs text-inkSoft">{lang === 'en' ? 'Journal: ' : '期刊：'}{journal}</p>}
      {affiliation && <p className="inline-flex items-center gap-1.5 text-xs text-inkSoft"><Building2 size={12} className="text-brand-400" />{lang === 'en' ? 'Affiliation: ' : '发表单位：'}{affiliation}</p>}
      {paper.doi && <p className="font-mono text-[11px] text-brand-600">DOI: {paper.doi}</p>}
      <div className="flex flex-wrap gap-1.5">{tagsFor(paper, lang).map((tag) => <span key={tag} className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">{tag}</span>)}</div>
    </div>
    </a>
    {relatedBlog && <Link to={`/blog/${relatedBlog}`} className="absolute bottom-3 right-4 z-10 text-xs font-semibold text-brand-600 underline-offset-2 transition hover:underline">Blog --&gt;</Link>}
  </div>
}
