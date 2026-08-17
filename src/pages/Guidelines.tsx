import { useState } from 'react'
import SectionTitle from '@/components/SectionTitle'
import Reveal from '@/components/Reveal'
import GuidelineCard from '@/components/GuidelineCard'
import PageHero from '@/components/PageHero'
import { guidelines } from '@/lib/data'
import { PAGE_HERO_IMAGES } from '@/lib/images'
import { getCancerLabel } from '@/types'
import type { CancerKey, Guideline } from '@/types'
import { useI18n } from '@/lib/i18n'

/** A guideline belongs to a cancer tab if its single cancer or its cancers array includes the key */
function matchCancer(g: Guideline, key: CancerKey): boolean {
  return g.cancer === key || (g.cancers?.includes(key) ?? false)
}

export default function Guidelines() {
  const { t, lang } = useI18n()
  const [tab, setTab] = useState<CancerKey | 'all'>('all')
  const filtered = tab === 'all' ? guidelines : guidelines.filter((g) => matchCancer(g, tab))

  const cancerKeys: CancerKey[] = ['cervical', 'endometrial', 'ovarian']
  const tabs: { key: CancerKey | 'all'; label: string }[] = [
    { key: 'all', label: t('common.all') },
    ...cancerKeys.map((c) => ({ key: c, label: getCancerLabel(c, lang) })),
  ]

  return (
    <div>
      <PageHero
        image={PAGE_HERO_IMAGES.guidelines}
        eyebrow={t('guidelines.hero.eyebrow')}
        title={t('guidelines.hero.title')}
        subtitle={t('guidelines.hero.subtitle')}
      />

      <section className="py-10 md:py-16">
        <div className="shell">
          <div className="mb-10 flex flex-wrap justify-center gap-2">
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
                <span className="ml-1.5 text-xs opacity-60">
                  {tabItem.key === 'all' ? guidelines.length : guidelines.filter((g) => matchCancer(g, tabItem.key as CancerKey)).length}
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((g, i) => (
              <Reveal key={g.id} delay={(i % 3) * 0.08}>
                <GuidelineCard guideline={g} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
