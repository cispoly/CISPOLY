import { useParams, Link, Navigate } from '@/lib/router'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Users,
  Stethoscope,
  Beaker,
  ShieldCheck,
  Dna,
  CircleHelp,
  Mail,
} from 'lucide-react'
import SectionTitle from '@/components/SectionTitle'
import Reveal from '@/components/Reveal'
import MetricBar from '@/components/MetricBar'
import PaperCard from '@/components/PaperCard'
import GuidelineCard from '@/components/GuidelineCard'
import CardMarquee from '@/components/CardMarquee'
import ProductCard from '@/components/ProductCard'
import { getProduct, products } from '@/lib/data/products'
import { heroImage } from '@/lib/images'
import { getPapersByCancer } from '@/lib/data/papers'
import { getGuidelinesByCancer } from '@/lib/data/guidelines'
import { useI18n, pick } from '@/lib/i18n'
import type { MetaFunction } from 'react-router'
import { pageMeta, breadcrumbSchema } from '@/lib/seo'

export const meta: MetaFunction = ({ params, location }) => {
  const product = params.slug ? getProduct(params.slug) : undefined
  if (!product) return [{ title: 'Products | CISPOLY' }]
  const faq = product.faq || []
  // 场景词按产品定制：覆盖"HPV阳性分流""异常子宫出血筛查""盆腔肿物鉴别"等搜索意图入口
  const sceneZh: Record<string, string> = {
    cervical: '禾宫康 CISCER® 检测宫颈脱落细胞 PAX1/JAM3 甲基化，适用于 HPV 阳性分流、TCT 轻度异常（ASC-US）分流与宫颈癌筛查，CIN2+ 灵敏度 89.6%、特异性 96.5%（国械注准 20233400253）。',
    endometrial: '禾蔻安 CISENDO® 检测 CDO1/CELF4 甲基化，适用于异常子宫出血、绝经后子宫内膜癌筛查与宫腔镜术前风险分层，灵敏度 94.5%（国械注准 20243402610），全球首个无创子宫内膜癌甲基化检测。',
    ovarian: '禾薇益 CISOVA® 一管外周血检测 CDO1/HOXA9 甲基化，适用于卵巢囊肿/盆腔肿物良恶性鉴别与卵巢癌早期筛查，灵敏度 93.2%（国械注准 20253402443），国内首个获批的卵巢癌甲基化检测。',
  }
  const sceneEn: Record<string, string> = {
    cervical: 'CISCER detects PAX1/JAM3 methylation in cervical exfoliated cells for HPV-positive triage, ASC-US management, and cervical cancer screening (89.6% sensitivity for CIN2+).',
    endometrial: 'CISENDO detects CDO1/CELF4 methylation for abnormal uterine bleeding workup, postmenopausal endometrial cancer screening, and pre-hysteroscopy risk stratification (94.5% sensitivity) — the world’s first non-invasive endometrial cancer methylation test.',
    ovarian: 'CISOVA detects CDO1/HOXA9 methylation from one tube of blood for benign-vs-malignant differentiation of ovarian cysts and pelvic masses, and early ovarian cancer screening (93.2% sensitivity) — the first approved ovarian cancer methylation test in China.',
  }
  return pageMeta(location.pathname, {
    titleZh: `${product.fullName}｜${product.cancer}甲基化检测 | CISPOLY 聚禾生物`,
    titleEn: `${product.fullNameEn || product.englishName} — ${product.cancerEn} Methylation Test (${product.genes.join('/')}) | CISPOLY`,
    descriptionZh: sceneZh[product.cancerKey] || product.summary,
    descriptionEn: sceneEn[product.cancerKey] || product.summaryEn || product.summary,
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'MedicalDevice',
        name: product.fullName,
        alternateName: product.englishName,
        description: product.summary,
        category: 'In vitro diagnostic medical device (IVD)',
        medicalSpecialty: 'Gynecologic',
        url: `https://www.cispoly.com/products/${product.slug}/`,
        manufacturer: {
          '@type': 'Organization',
          name: 'CISPOLY',
          alternateName: '北京起源聚禾生物科技有限公司',
          url: 'https://www.cispoly.com',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      breadcrumbSchema(
        [
          { name: '产品中心', path: '/products' },
          { name: product.fullName, path: `/products/${product.slug}` },
        ],
        location.pathname,
      ),
    ],
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
  const faq = pick(product.faq, product.faqEn || product.faq, lang)
  const geneSuffix = lang === 'zh' ? '双基因甲基化' : t('product.dualGene')
  const registration = lang === 'en' ? product.registration.replace(/^国械注准\s*/, '') : product.registration
  const dnaIsolationFiling = product.slug === 'cisova' ? '20240021' : '20210020'

  // 询盘链路文案：产品页 → 资料/报价/合作（海外采购与临床合作方的下一步）
  const copy =
    lang === 'en'
      ? {
          h1Suffix: `${cancer} Methylation Test (${product.genes.join('/')})`,
          heroCta: 'Request IFU & pricing',
          heroCta2: 'See clinical evidence',
          back: 'Back to products',
          ctaEyebrow: 'Next step',
          ctaTitle: 'Request the IFU, clinical summary and pricing',
          ctaDesc:
            'Tell us your institution type and intended use. We reply within 1–2 business days with the documents below, and can arrange a technical call with our clinical team.',
          ctaBullets: [
            'IFU, registration certificate and sample requirements',
            'Clinical performance summary and published papers',
            'Distributor terms, kit configuration and logistics',
          ],
          ctaPrimary: 'Request product information',
          ctaSecondary: 'Compare all three tests',
          otherTitle: 'The same methylation platform, two more cancers',
          otherDesc: 'CISPOLY covers cervical, endometrial and ovarian cancer with one non-invasive workflow.',
          otherAll: 'All products',
          mailNote: 'Prefer email?',
        }
      : {
          h1Suffix: `${cancer}甲基化检测（${product.genes.join('/')}）`,
          heroCta: '获取产品资料与报价',
          heroCta2: '查看临床证据',
          back: '返回产品中心',
          ctaEyebrow: '合作入口',
          ctaTitle: '获取说明书、临床数据摘要与报价',
          ctaDesc:
            '告知您的机构类型与使用场景，我们将在 1–2 个工作日内提供下列资料，并可安排临床团队技术沟通。',
          ctaBullets: [
            '说明书、注册证与样本要求',
            '临床效能摘要与已发表文献',
            '代理政策、试剂配置与物流方案',
          ],
          ctaPrimary: '获取产品资料',
          ctaSecondary: '对比三大产品',
          otherTitle: '同一甲基化平台，覆盖另两大类妇科肿瘤',
          otherDesc: '一套无创采样流程，覆盖宫颈癌、子宫内膜癌与卵巢癌。',
          otherAll: '全部产品',
          mailNote: '也可直接邮件联系：',
        }

  const otherProducts = products.filter((p) => p.slug !== product.slug)

  // 产品 hero 背景图（与首页同风格）
  const heroImagePath = (() => {
    switch (product.slug) {
      case 'ciscer': return '/hero/becca-tapert-u5e1kqW6E3M.jpg'
      case 'cisendo': return '/hero/becca-tapert-eAfrl7A6gBs.jpg'
      case 'cisova': return '/hero/isaac-iverson-lvYf2D6R4Nk.jpg'
      default: return '/hero/becca-tapert-u5e1kqW6E3M.jpg'
    }
  })()

  const hero = heroImage(heroImagePath)

  return (
    <div>
      {/* ===== Hero（与首页同风格，无需轮动） ===== */}
      <section className="relative overflow-hidden">
        {/* 背景图 */}
        <div className="absolute inset-0">
          <img
            src={hero.src}
            srcSet={hero.srcSet}
            sizes={hero.sizes}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
          />
        </div>
        {/* 毛玻璃遮罩层（与首页同款，更透明让底图透出） */}
        <div className="absolute inset-0 bg-canvas/15 backdrop-blur-sm" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-canvas/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/55 via-canvas/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas to-transparent" />

        <div className="shell relative py-16 md:py-24">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/60 transition hover:text-brand-600"
          >
            <ArrowLeft size={15} /> {copy.back}
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

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink md:text-6xl">
              {fullName}
              <span className="mt-3 block text-lg font-semibold leading-snug text-ink/70 md:text-2xl">
                {copy.h1Suffix}
              </span>
            </h1>
            <p className="mt-3 text-lg font-medium text-ink/80 md:text-xl">{tagline}</p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/70">{summary}</p>

            {/* 注册证 */}
            <div className="mt-8 inline-flex items-center gap-2.5 rounded-xl border border-line/60 bg-white/60 px-5 py-3 backdrop-blur">
              <ShieldCheck size={20} className="text-brand-500" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink/50">{t('product.nmpaLabel')}</div>
                <div className="font-mono text-sm font-semibold text-ink">{registration}</div>
              </div>
              <div className="ml-4 border-l border-line/70 pl-4">
                <div className="text-[11px] uppercase tracking-wider text-ink/50">{t('product.regDateLabel')}</div>
                <div className="text-sm font-semibold text-ink">{product.regDate}</div>
              </div>
            </div>
            {/* 首屏询盘入口：采购/合作方不用滑到底就能行动 */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/contact" className="btn-primary">
                <Mail size={16} /> {copy.heroCta}
              </Link>
              <Link to="/papers" className="btn-ghost">
                {copy.heroCta2} <ArrowRight size={16} />
              </Link>
            </div>

            {lang === 'en' && (
              <div className="mt-8 max-w-2xl rounded-xl border border-line/60 bg-white/70 px-5 py-4 text-sm leading-relaxed text-ink/80 backdrop-blur">
                <p className="font-semibold text-ink">Recommended companion kits</p>
                <p className="mt-1.5">
                  Use the <strong className="font-bold text-ink">DNA Isolation and Purifying Kit (Beijing Medical Device No. {dnaIsolationFiling})</strong> for DNA extraction and purification,
                  followed by <strong className="font-bold text-ink">DNA Methylation-Lightning MagPrep (Beijing Medical Device No. 20200110)</strong> for bisulfite conversion.
                </p>
              </div>
            )}
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

      {/* ===== 常见问题 FAQ（自包含答案，供搜索引擎与 AI 提取） ===== */}
      <section className="bg-white py-20 md:py-28">
        <div className="shell">
          <SectionTitle eyebrow={t('product.faq.eyebrow')} title={t('product.faq.title')} />
          <div className="mx-auto mt-12 max-w-3xl space-y-4">
            {faq.map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <details className="card group overflow-hidden p-0" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 md:p-6">
                    <span className="flex items-start gap-3 text-[15px] font-semibold text-ink md:text-base">
                      <CircleHelp size={19} className="mt-0.5 shrink-0 text-brand-400" />
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-inkSoft/50 transition-transform duration-300 group-open:rotate-45"
                    >
                      ＋
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-[14px] leading-relaxed text-ink/80 md:px-6 md:pb-6 md:pl-[3.25rem]">
                    {item.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 询盘入口（采购/合作方的下一步） ===== */}
      <section className="pb-4 pt-4">
        <div className="shell">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 px-6 py-10 md:px-12 md:py-14">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="relative grid gap-10 md:grid-cols-[1.5fr_1fr] md:items-center">
                <div className="text-white">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    {copy.ctaEyebrow}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold leading-snug tracking-tight md:text-3xl">
                    {copy.ctaTitle}
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
                    {copy.ctaDesc}
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {copy.ctaBullets.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-white/90">
                        <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-white/70" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                  >
                    <Mail size={16} /> {copy.ctaPrimary}
                  </Link>
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {copy.ctaSecondary} <ArrowRight size={16} />
                  </Link>
                  <p className="mt-1 text-center text-xs text-white/70">
                    {copy.mailNote}{' '}
                    <a href="mailto:OPBT@cispoly.com" className="underline underline-offset-2 hover:text-white">
                      OPBT@cispoly.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 产品互链 ===== */}
      <section className="py-16 md:py-24">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionTitle
                eyebrow={lang === 'en' ? 'Product Portfolio' : '产品矩阵'}
                title={copy.otherTitle}
                subtitle={copy.otherDesc}
              />
            </div>
            <Link to="/products" className="btn-ghost shrink-0">
              {copy.otherAll} <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {otherProducts.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
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
                      <div key={p.id} className="w-[360px] sm:w-[500px] lg:w-[560px]">
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
                      <div key={g.id} className="w-[360px] sm:w-[500px] lg:w-[560px]">
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
