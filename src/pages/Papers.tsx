import { useState } from 'react'
import Reveal from '@/components/Reveal'
import PaperCard from '@/components/PaperCard'
import PageHero from '@/components/PageHero'
import { papers } from '@/lib/data/papers'
import { PAGE_HERO_IMAGES } from '@/lib/images'
import { getCancerLabel } from '@/types'
import type { CancerKey } from '@/types'
import { useI18n } from '@/lib/i18n'
import type { MetaFunction } from 'react-router'
import { pageMeta } from '@/lib/seo'

export const meta: MetaFunction = ({ location }) => pageMeta(location.pathname, {
  titleZh: '学术论文 | CISPOLY 聚禾生物',
  titleEn: 'Research Publications | CISPOLY',
  descriptionZh: '浏览聚禾生物在宫颈癌、子宫内膜癌和卵巢癌 DNA 甲基化检测领域的临床研究与学术论文。',
  descriptionEn: 'Explore CISPOLY clinical research and publications on DNA methylation testing for gynecologic cancers.',
})

export default function Papers() {
  const { t, lang } = useI18n()
  const [tab, setTab] = useState<CancerKey | 'all'>('all')

  const filtered = tab === 'all' ? papers : papers.filter((p) => p.cancer === tab)

  const cancerKeys: CancerKey[] = ['cervical', 'endometrial', 'ovarian']
  const tabs: { key: CancerKey | 'all'; label: string }[] = [
    { key: 'all', label: t('common.all') },
    ...cancerKeys.map((c) => ({ key: c, label: getCancerLabel(c, lang) })),
  ]

  return (
    <div>
      <PageHero
        image={PAGE_HERO_IMAGES.papers}
        eyebrow={t('papers.hero.eyebrow')}
        title={t('papers.hero.title')}
        subtitle={t('papers.hero.subtitle')}
      />

      {/* Tab + 列表 */}
      <section className="py-10 md:py-16">
        <div className="shell">
          <div className="mb-10 flex flex-wrap gap-2">
            {tabs.map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => setTab(tabItem.key)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  tab === tabItem.key
                    ? 'bg-brand-500 text-white shadow-soft'
                    : 'border border-line bg-white text-ink/70 hover:border-brand-200 hover:text-brand-600'
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <Reveal key={p.id} delay={(i % 3) * 0.06} className="h-full">
                <PaperCard paper={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
