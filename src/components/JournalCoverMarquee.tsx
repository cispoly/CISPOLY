import PaperCard from '@/components/PaperCard'
import type { Paper } from '@/types'
import { useI18n } from '@/lib/i18n'

/**
 * 学术文献卡片轮动条 —— 与列表页相同的文献卡片从右向左无缝轮动。
 * 卡片保留标题、期刊、发表单位、DOI 和标签，封面使用对应期刊封面。
 */
export default function JournalCoverMarquee({ papers }: { papers: Paper[] }) {
  const { t } = useI18n()
  // 复制两份实现无缝循环
  const doubled = [...papers, ...papers]
  return (
    <div className="relative mt-12 overflow-hidden py-2" aria-label={t('marquee.ariaLabel')}>
      {/* 左右渐隐遮罩 */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

      <div className="journal-marquee-track">
        {doubled.map((p, i) => (
          <div key={p.id + '-' + i} className="w-[360px] shrink-0 sm:w-[500px] lg:w-[560px]">
            <PaperCard paper={p} />
          </div>
        ))}
      </div>

      <style>{`
        .journal-marquee-track {
          display: flex;
          gap: 24px;
          width: max-content;
          animation: journal-marquee 180s linear infinite;
        }
        .journal-marquee-track:hover { animation-play-state: paused; }
        @keyframes journal-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-50% - 12px)); }
        }
      `}</style>
    </div>
  )
}
