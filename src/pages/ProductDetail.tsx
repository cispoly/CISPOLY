import { useParams, Link, Navigate } from '@/lib/router'
import {
  ArrowLeft,
  CheckCircle2,
  Users,
  Stethoscope,
  Beaker,
  ShieldCheck,
  Building2,
  Dna,
} from 'lucide-react'
import SectionTitle from '@/components/SectionTitle'
import Reveal from '@/components/Reveal'
import MetricBar from '@/components/MetricBar'
import PaperCard from '@/components/PaperCard'
import GuidelineCard from '@/components/GuidelineCard'
import ChinaHospitalMap from '@/components/ChinaHospitalMap'
import CardMarquee from '@/components/CardMarquee'
import { CISCER_HOSPITALS } from '@/data/china-hospitals'
import { CISENDO_HOSPITALS } from '@/data/cisendo-hospitals'
import { CISOVA_HOSPITALS } from '@/data/cisova-hospitals'
import { getProduct } from '@/lib/data/products'
import { getPapersByCancer } from '@/lib/data/papers'
import { getGuidelinesByCancer } from '@/lib/data/guidelines'
import { useI18n, pick } from '@/lib/i18n'
import type { MetaFunction } from 'react-router'
import { pageMeta } from '@/lib/seo'

export const meta: MetaFunction = ({ params, location }) => {
  const product = params.slug ? getProduct(params.slug) : undefined
  if (!product) return [{ title: 'Products | CISPOLY' }]
  return pageMeta(location.pathname, {
    titleZh: `${product.fullName}｜${product.cancer}甲基化检测 | CISPOLY`,
    titleEn: `${product.fullNameEn || product.englishName} | CISPOLY`,
    descriptionZh: product.summary,
    descriptionEn: product.summaryEn || product.summary,
  })
}

export default function ProductDetail() {
  const { t, lang } = useI18n()
  const { slug } = useParams()
  const product = slug ? getProduct(slug) : undefined

  if (!product) return <Navigate to="/" replace />

  const papers = getPapersByCancer(product.cancerKey)
  const guidelines = getGuidelinesByCancer(product.cancerKey)

  // Bilingual fields
  const fullName = pick(product.fullName, product.fullNameEn || product.fullName, lang)
  const cancer = pick(product.cancer, product.cancerEn || product.cancer, lang)
  const tagline = pick(product.tagline, product.taglineEn || product.tagline, lang)
  const summary = pick(product.summary, product.summaryEn || product.summary, lang)
  const targetPopulation = pick(product.targetPopulation, product.targetPopulationEn || product.targetPopulation, lang)
  const scenarios = pick(product.scenarios, product.scenariosEn || product.scenarios, lang)
  const metrics = pick(product.metrics, product.metricsEn || product.metrics, lang)
  const sampleType = pick(product.sampleType, product.sampleTypeEn || product.sampleType, lang)
  const highlights = pick(product.highlights, product.highlightsEn || product.highlights, lang)
  const hospitals = pick(product.hospitals, product.hospitalsEn || product.hospitals, lang)
  const geneSuffix = lang === 'zh' ? '双基因甲基化' : t('product.dualGene')

  // 产品 hero 背景图（与首页同风格）
  const heroImage = (() => {
    switch (product.slug) {
      case 'ciscer': return '/hero/becca-tapert-u5e1kqW6E3M.jpg'
      case 'cisendo': return '/hero/becca-tapert-eAfrl7A6gBs.jpg'
      case 'cisova': return '/hero/isaac-iverson-lvYf2D6R4Nk.jpg'
      default: return '/hero/becca-tapert-u5e1kqW6E3M.jpg'
    }
  })()

  return (
    <div>
      {/* ===== Hero（与首页同风格，无需轮动） ===== */}
      <section className="relative overflow-hidden">
        {/* 背景图 */}
        <div className="absolute inset-0">
          <img src={heroImage} alt="" className="h-full w-full object-cover" loading="eager" />
        </div>
        {/* 毛玻璃遮罩层（与首页同款，更透明让底图透出） */}
        <div className="absolute inset-0 bg-canvas/15 backdrop-blur-sm" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-canvas/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/55 via-canvas/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas to-transparent" />

        <div className="shell relative py-16 md:py-24">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition hover:text-brand-600"
          >
            <ArrowLeft size={15} /> {t('product.backToProducts')}
          </Link>

          <div className="mt-8 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-brand-200 bg-white/60 px-4 py-1.5 text-xs font-semibold text-brand-600 backdrop-blur">
                {cancer}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70">
                <Dna size={15} className="text-brand-500" /> {product.genes.join(' / ')} {geneSuffix}
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink md:text-6xl">{fullName}</h1>
            <p className="mt-3 text-lg font-medium text-ink/80 md:text-xl">{tagline}</p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{summary}</p>

            {/* 注册证 */}
            <div className="mt-8 inline-flex items-center gap-2.5 rounded-xl border border-line/60 bg-white/60 px-5 py-3 backdrop-blur">
              <ShieldCheck size={20} className="text-brand-500" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink/50">{t('product.nmpaLabel')}</div>
                <div className="font-mono text-sm font-semibold text-ink">{product.registration}</div>
              </div>
              <div className="ml-4 border-l border-line/70 pl-4">
                <div className="text-[11px] uppercase tracking-wider text-ink/50">{t('product.regDateLabel')}</div>
                <div className="text-sm font-semibold text-ink">{product.regDate}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 临床数据 ===== */}
      <section className="py-20 md:py-28">
        <div className="shell">
          <SectionTitle
            eyebrow={t('product.clinicalData.eyebrow')}
            title={t('product.clinicalData.title')}
            subtitle={t('product.clinicalData.subtitle')}
          />

          <div className="mt-14 grid gap-x-16 gap-y-10 md:grid-cols-2">
            {metrics
              .filter((m) => m.value.includes('%'))
              .map((m, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <MetricBar label={m.label} value={m.value} sub={m.sub} color={product.color} delay={i * 0.1} />
                </Reveal>
              ))}
          </div>

          {/* 样本量卡片 */}
          <Reveal delay={0.2}>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {metrics
                .filter((m) => !m.value.includes('%'))
                .map((m, i) => (
                  <div key={i} className="card flex items-center gap-5 p-6">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-500">
                      <Beaker size={22} />
                    </span>
                    <div>
                      <div className="font-mono text-2xl font-bold text-ink">
                        {m.value}
                        {m.sub && <span className="ml-1 text-sm font-medium text-inkSoft">{m.sub}</span>}
                      </div>
                      <div className="text-sm text-inkSoft">{m.label}</div>
                    </div>
                  </div>
                ))}
              <div className="card flex items-center gap-5 p-6">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-500">
                  <Dna size={22} />
                </span>
                <div>
                  <div className="text-base font-semibold text-ink">{sampleType}</div>
                  <div className="text-sm text-inkSoft">{t('product.sampleType')}</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 目标人群 & 使用场景 ===== */}
      <section className="bg-white py-20 md:py-28">
        <div className="shell grid gap-14 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="eyebrow">
                <Users size={14} /> {t('product.target.eyebrow')}
              </span>
              <h2 className="mt-4 text-2xl font-bold text-ink md:text-3xl">{t('product.target.title')}</h2>
              <ul className="mt-7 space-y-3">
                {targetPopulation.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink/85">
                    <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div>
              <span className="eyebrow">
                <Stethoscope size={14} /> {t('product.scenarios.eyebrow')}
              </span>
              <h2 className="mt-4 text-2xl font-bold text-ink md:text-3xl">{t('product.scenarios.title')}</h2>
              <ul className="mt-7 space-y-3">
                {scenarios.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed text-ink/85">
                    <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 亮点 ===== */}
      <section className="py-20 md:py-28">
        <div className="shell">
          <SectionTitle eyebrow={t('product.highlights.eyebrow')} title={t('product.highlights.title')} />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((h, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="card h-full p-6">
                  <div className="font-mono text-3xl font-bold text-brand-200">0{i + 1}</div>
                  <p className="mt-3 text-[14px] font-medium leading-relaxed text-ink/85">{h}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 合作医院 ===== */}
      <section className="bg-white py-20 md:py-28">
        <div className="shell">
          <SectionTitle
            eyebrow={t('product.network.eyebrow')}
            title={t('product.network.title')}
            subtitle={t('product.network.subtitle')}
          />
          <Reveal delay={0.1}>
            {product.slug === 'ciscer' ? (
              <div className="mt-10">
                <ChinaHospitalMap hospitals={CISCER_HOSPITALS} />
              </div>
            ) : product.slug === 'cisendo' ? (
              <div className="mt-10">
                <ChinaHospitalMap hospitals={CISENDO_HOSPITALS} />
              </div>
            ) : product.slug === 'cisova' ? (
              <div className="mt-10">
                <ChinaHospitalMap hospitals={CISOVA_HOSPITALS} />
              </div>
            ) : (
              <div className="mt-12 flex flex-wrap justify-center gap-4">
                {hospitals.map((h, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-2.5 rounded-full border border-line bg-canvas px-6 py-3 text-sm font-medium text-ink"
                  >
                    <Building2 size={16} className="text-brand-400" /> {h}
                  </div>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ===== 相关论文 & 指南 ===== */}
      {(papers.length > 0 || guidelines.length > 0) && (
        <section className="py-20 md:py-28">
          <div className="shell">
            {papers.length > 0 && (
              <>
                <SectionTitle eyebrow={t('product.papers.eyebrow')} title={`${cancer} ${t('product.papers.titleSuffix')}`} />
                <CardMarquee duration={papers.length > 6 ? 80 : 50}>
                  {papers.map((p) => (
                    <div key={p.id} className="w-[300px] md:w-[340px]">
                      <PaperCard paper={p} />
                    </div>
                  ))}
                </CardMarquee>
              </>
            )}
            {guidelines.length > 0 && (
              <>
                <div className="mt-20">
                  <SectionTitle eyebrow={t('product.guidelines.eyebrow')} title={t('product.guidelines.title')} />
                  <CardMarquee duration={40}>
                    {guidelines.map((g) => (
                      <div key={g.id} className="w-[300px] md:w-[340px]">
                        <GuidelineCard guideline={g} />
                      </div>
                    ))}
                  </CardMarquee>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
