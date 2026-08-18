import { Link } from '@/lib/router'
import { ExternalLink, Quote, Building2, BookOpen, Calendar } from 'lucide-react'
import type { Paper } from '@/types'
import { useI18n } from '@/lib/i18n'
import { getCancerLabel } from '@/types'

/**
 * 文献卡 v5 —— 统一尺寸卡片，展示 CSV 来源的元数据 + 中文摘要总结。
 *
 * 展示内容（自上而下）：
 *  ① 癌种标签 + 年份
 *  ② 标题（line-clamp-3）
 *  ③ 发表杂志
 *  ④ 发表单位
 *  ⑤ DOI（可点击）
 *  ⑥ 摘要总结（中文，line-clamp-4）
 *
 * 所有卡片高度固定 h-[440px]，宽度由网格控制，确保视觉统一。
 */
export default function PaperCard({ paper }: { paper: Paper }) {
  const { lang } = useI18n()
  const journal = paper.journal ? paper.journal.split('.').slice(0, 2).join('.').replace(/\(20\d{2}\)/, '') : ''
  const cancerLabel = getCancerLabel(paper.cancer, lang)
  const summary = lang === 'en' && paper.summaryEn ? paper.summaryEn : paper.summary
  const title = lang === 'en' && paper.titleEn ? paper.titleEn : paper.title
  const affiliation = lang === 'en' && paper.affiliationEn ? paper.affiliationEn : paper.affiliation
  const cardHeight = lang === 'en' ? 'h-[520px]' : 'h-[440px]'

  return (
    <Link
      to={`/papers/${paper.cancer}/${paper.id}`}
      className={`group flex ${cardHeight} flex-col rounded-2xl border border-line bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift md:p-7`}
    >
      {/* ① 癌种标签 + 年份 */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
          {cancerLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-inkSoft">
          <Calendar size={12} />
          {paper.year || ''}
        </span>
      </div>

      {/* ② 标题 */}
      <h3 className="mt-4 shrink-0 line-clamp-3 text-base font-bold leading-snug text-ink transition-colors group-hover:text-brand-600 md:text-[17px]">
        {title}
      </h3>

      {/* ③ 发表杂志 */}
      {journal && (
        <p className="mt-3 inline-flex shrink-0 items-start gap-1.5 text-xs leading-relaxed text-ink/60">
          <BookOpen size={13} className="mt-0.5 shrink-0 text-brand-400" />
          <span className="line-clamp-1">{journal}</span>
        </p>
      )}

      {/* ④ 发表单位 */}
      {paper.affiliation && (
        <p className="mt-1.5 inline-flex shrink-0 items-start gap-1.5 text-xs leading-relaxed text-inkSoft/80">
          <Building2 size={13} className="mt-0.5 shrink-0 text-brand-400" />
          <span className="line-clamp-1">{affiliation}</span>
        </p>
      )}

      {/* ⑤ DOI */}
      {paper.doi && (
        <a
          href={`https://doi.org/${paper.doi}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-flex shrink-0 max-w-full items-start gap-1.5 font-mono text-xs text-brand-600 underline-offset-2 transition hover:underline"
        >
          <span className="break-all leading-relaxed line-clamp-1">DOI: {paper.doi}</span>
          <ExternalLink size={12} className="mt-0.5 shrink-0" />
        </a>
      )}

      {/* ⑥ 摘要总结 */}
      {paper.summary && (
        <div className="mt-4 min-h-0 flex-1 border-t border-line pt-4">
          <div className="flex items-start gap-2.5">
            <Quote size={16} className="mt-0.5 shrink-0 text-brand-300" />
            <p className="text-[13px] leading-relaxed text-ink/75">{summary}</p>
          </div>
        </div>
      )}

    </Link>
  )
}
