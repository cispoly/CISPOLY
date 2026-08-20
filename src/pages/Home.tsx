import { Link } from '@/lib/router'
import { ArrowRight, FlaskConical, BookOpenCheck, Newspaper } from 'lucide-react'
import Hero from '@/components/Hero'
import SectionTitle from '@/components/SectionTitle'
import Reveal from '@/components/Reveal'
import ProductCard from '@/components/ProductCard'
import GuidelineCard from '@/components/GuidelineCard'
import JournalCoverMarquee from '@/components/JournalCoverMarquee'
import { products } from '@/lib/data/products'
import { company } from '@/lib/data/company'
import { papers } from '@/lib/data/papers'
import { guidelines } from '@/lib/data/guidelines'
import { latestBlogs } from '@/lib/data/blogs'
import { useI18n, pick } from '@/lib/i18n'
import type { MetaFunction } from 'react-router'
import { pageMeta } from '@/lib/seo'

export const meta: MetaFunction = ({ location }) => pageMeta(location.pathname, {
  titleZh: 'CISPOLY 聚禾生物 | 妇科肿瘤甲基化早筛早诊开拓者',
  titleEn: 'CISPOLY | Methylation-Based Early Detection for Gynecologic Cancers',
  descriptionZh: '聚禾生物专注宫颈癌、子宫内膜癌和卵巢癌的 DNA 甲基化无创早筛早诊产品与临床研究。',
  descriptionEn: 'CISPOLY develops non-invasive DNA methylation tests and clinical evidence for cervical, endometrial, and ovarian cancer detection.',
  image: '/hero/becca-tapert-u5e1kqW6E3M.jpg',
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CISPOLY',
    alternateName: '聚禾生物',
    url: 'https://www.cispoly.com',
    logo: 'https://www.cispoly.com/logo.png',
  },
})

export default function Home() {
  const { t, lang } = useI18n()

  // 首页精选指南
  const homeGuidelines = ['9_pax1jam3_consensus', '2_ec_methylation_consensus2026', '14_esgo_position_screening']
    .map((id) => guidelines.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))
    .sort((a, b) => (b.year || 0) - (a.year || 0))
  const recentBlogs = latestBlogs(4)
  const stats = pick(company.stats, company.statsEn || company.stats, lang)

  return (
    <>
      <Hero />

      {/* ===== 使命陈述 ===== */}
      <section className="py-14 md:py-32">
        <div className="shell">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow justify-center">{t('home.vision.eyebrow')}</span>
              <div className="mt-7 space-y-2.5">
                {[
                  { word: t('home.vision.line1.word'), rest: t('home.vision.line1.rest') },
                  { word: t('home.vision.line2.word'), rest: t('home.vision.line2.rest') },
                  { word: t('home.vision.line3.word'), rest: t('home.vision.line3.rest') },
                ].map((line) => (
                  <p
                    key={line.word}
                    className="text-2xl font-medium leading-snug tracking-tight text-ink md:text-[2rem]"
                  >
                    <span className="text-brand-500">{line.word}</span>
                    {line.rest}
                  </p>
                ))}
              </div>
              <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-inkSoft">
                {t('home.vision.subtitle')}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 产品矩阵 ===== */}
      <section className="bg-white py-24 md:py-32">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle
              eyebrow={t('home.products.eyebrow')}
              title={
                <span className="whitespace-nowrap text-[clamp(1.3rem,4.9vw,2.5rem)]">
                  {t('home.products.title1')}
                  {lang === 'zh' ? '' : ' '}
                  {t('home.products.title2')}
                </span>
              }
              subtitle={t('home.products.subtitle')}
            />
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 权威数据看板 ===== */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="shell relative">
          <div className="mx-auto max-w-2xl text-center text-white">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <span className="inline-block h-px w-8 bg-white/50" /> {t('home.stats.eyebrow')}
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{t('home.stats.title')}</h2>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-5">
            {stats.map((s, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div className="text-center text-white">
                  <div className="text-4xl font-bold tracking-tight md:text-5xl">
                    {s.value}
                    {lang === 'en' && /[a-zA-Z0-9]$/.test(s.value) && /^[a-zA-Z]/.test(s.unit) ? ' ' : ''}
                    <span className="text-lg font-semibold text-white/60">{s.unit}</span>
                  </div>
                  <div className="mt-2 text-xs leading-snug text-white/70">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 精选论文 ===== */}
      <section className="py-24 md:py-32">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle
              eyebrow={t('home.papers.eyebrow')}
              title={
                <span className="inline-flex items-center gap-3">
                  <FlaskConical className="text-brand-400" size={32} strokeWidth={1.5} />
                  {t('home.papers.title')}
                </span>
              }
              subtitle={t('home.papers.subtitle')}
            />
            <Reveal delay={0.1}>
              <Link to="/papers" className="btn-ghost shrink-0">
                {t('common.allPapers')} <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>

          <JournalCoverMarquee papers={papers} />
        </div>
      </section>

      {/* ===== 临床指南 ===== */}
      <section className="bg-white py-24 md:py-32">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle
              eyebrow={t('home.guidelines.eyebrow')}
              title={
                <span className="inline-flex items-center gap-3">
                  <BookOpenCheck className="text-brand-400" size={32} strokeWidth={1.5} />
                  {t('home.guidelines.title')}
                </span>
              }
              subtitle={t('home.guidelines.subtitle')}
            />
            <Reveal delay={0.1}>
              <Link to="/guidelines" className="btn-ghost shrink-0">
                {t('common.allGuidelines')} <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {homeGuidelines.map((g, i) => (
              <Reveal key={g.id} delay={i * 0.08}>
                <GuidelineCard guideline={g} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 最新动态 / 博客 ===== */}
      <section className="py-24 md:py-32">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle
              eyebrow={t('home.news.eyebrow')}
              title={
                <span className="inline-flex items-center gap-3">
                  <Newspaper className="text-brand-400" size={32} strokeWidth={1.5} />
                  {t('home.news.title')}
                </span>
              }
              subtitle={t('home.news.subtitle')}
            />
            <Reveal delay={0.1}>
              <Link to="/blog" className="btn-ghost shrink-0">
                {t('common.allBlogs')} <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {recentBlogs.map((b, i) => (
              <Reveal key={b.slug} delay={i * 0.07}>
                <Link
                  to={`/blog/${b.slug}`}
                  className="card card-hover group flex h-full flex-col overflow-hidden"
                >
                  <div className="aspect-[2.35/1] overflow-hidden bg-canvas">
                    {(lang === 'en' && b.coverEn ? b.coverEn : b.cover) && (
                      <img
                        src={(lang === 'en' && b.coverEn ? b.coverEn : b.cover) as string}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          ;(e.currentTarget.parentElement as HTMLElement).style.background = '#F3EDEA'
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap gap-1.5">
                      {(lang === 'en' && b.tagsEn ? b.tagsEn : b.tags).slice(0, 2).map((tag, ti) => (
                        <span key={ti} className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="mt-2.5 line-clamp-3 flex-1 text-[14px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-600">
                      {lang === 'en' && b.titleEn ? b.titleEn : b.title}
                    </h3>
                    <div className="mt-3 text-[11px] text-inkSoft">{b.dateLabel}</div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
