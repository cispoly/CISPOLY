import { Link } from 'react-router-dom'
import { BookOpen, Calendar, Building2, ExternalLink, Quote } from 'lucide-react'
import type { Guideline } from '@/types'
import { useI18n } from '@/lib/i18n'
import { getCancerLabel } from '@/types'

/**
 * 指南卡 v4 —— 精美卡片，固定高度 h-[420px]，标题与摘要均使用 line-clamp 防溢出。
 *
 * 展示内容（自上而下）：
 *  ① 癌种标签 + 年份
 *  ② 标题（line-clamp-3）
 *  ③ 发布单位/机构
 *  ④ DOI（可点击）
 *  ⑤ 摘要/结论（line-clamp-5）
 */
export default function GuidelineCard({ guideline }: { guideline: Guideline }) {
  const { lang } = useI18n()
  const cancerLabels = (guideline.cancers ?? [guideline.cancer]).map((c) => getCancerLabel(c, lang))
  const abstract = lang === 'en' && (guideline.abstractEn || guideline.excerptEn) ? (guideline.abstractEn || guideline.excerptEn!) : (guideline.abstract || guideline.excerpt)
  const title = lang === 'en' && guideline.titleEn ? guideline.titleEn : guideline.title
  const publisher = lang === 'en' && guideline.publisherEn ? guideline.publisherEn : guideline.publisher
  return (
    <Link
      to={`/guidelines/${guideline.cancer}/${guideline.id}`}
      className="group flex h-[420px] flex-col rounded-2xl border border-line bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift md:p-7"
    >
      {/* ① 癌种标签 + 年份 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {cancerLabels.map((label, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
              <BookOpen size={12} /> {label}
            </span>
          ))}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-inkSoft">
          <Calendar size={12} />
          {guideline.year || ''}
        </span>
      </div>

      {/* ② 标题（最多 3 行，超长截断） */}
      <h3 className="mt-4 text-base font-bold leading-snug text-ink transition-colors group-hover:text-brand-600 md:text-[17px] line-clamp-3">
        {title}
      </h3>

      {/* ③ 发布单位（完整） */}
      {publisher && (
        <p className="mt-3 inline-flex items-start gap-1.5 text-xs leading-relaxed text-ink/60">
          <Building2 size={13} className="mt-0.5 shrink-0 text-brand-400" />
          <span>{publisher}</span>
        </p>
      )}

      {/* ④ DOI（完整、可点击） */}
      {guideline.doi && (
        <a
          href={`https://doi.org/${guideline.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-flex max-w-full items-start gap-1.5 font-mono text-xs text-brand-600 underline-offset-2 transition hover:underline"
        >
          <span className="break-all leading-relaxed">DOI: {guideline.doi}</span>
          <ExternalLink size={12} className="mt-0.5 shrink-0" />
        </a>
      )}

      {/* ⑤ 摘要/结论（完整） */}
      {abstract && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-start gap-2.5">
            <Quote size={16} className="mt-0.5 shrink-0 text-brand-300" />
            <p className="text-[13px] leading-relaxed text-ink/75 line-clamp-5">
              {abstract}
            </p>
          </div>
        </div>
      )}

    </Link>
  )
}
