import { useI18n } from '@/lib/i18n'

/**
 * 学术文献封面轮动条 —— 论文杂志封面/首页图从右向左无缝轮动。
 * 纯封面图轮动：每篇论文展示真实 paper cover（无文字卡、无 fallback 文案）。
 */
export default function JournalCoverMarquee({ papers }: { papers: Array<{ id: string; title: string; titleEn?: string; journal?: string; year?: number | null }> }) {
  const { t, lang } = useI18n()
  // 复制两份实现无缝循环
  const doubled = [...papers, ...papers]
  return (
    <div className="relative mt-12 overflow-hidden py-2" aria-label={t('marquee.ariaLabel')}>
      {/* 左右渐隐遮罩 */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

      <div className="journal-marquee-track">
        {doubled.map((p, i) => (
          <CoverItem key={p.id + '-' + i} paper={p} altFallback={t('marquee.coverAlt')} lang={lang} />
        ))}
      </div>

      <style>{`
        .journal-marquee-track {
          display: flex;
          gap: 24px;
          width: max-content;
          animation: journal-marquee 72s linear infinite;
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

function CoverItem({ paper, altFallback, lang }: { paper: { id: string; title: string; titleEn?: string; journal?: string; year?: number | null }; altFallback: string; lang: 'zh' | 'en' }) {
  const coverPath = `/images/journal-covers/${paper.id}.jpg`

  return (
    <div className="w-[200px] shrink-0">
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-soft">
        <img
          src={coverPath}
          alt={(lang === 'en' && paper.titleEn ? paper.titleEn : paper.title) || altFallback}
          className="aspect-[3/4] w-full object-cover object-top transition duration-300 hover:scale-105"
          loading="lazy"
        />
      </div>
    </div>
  )
}
