import { Link } from '@/lib/router'
import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from 'lucide-react'
import PageHero from '@/components/PageHero'
import SectionTitle from '@/components/SectionTitle'
import Reveal from '@/components/Reveal'
import ProductCard from '@/components/ProductCard'
import { products } from '@/lib/data/products'
import { PAGE_HERO_IMAGES } from '@/lib/images'
import { useI18n, pick } from '@/lib/i18n'
import type { MetaFunction } from 'react-router'
import { pageMeta, breadcrumbSchema } from '@/lib/seo'

export const meta: MetaFunction = ({ location }) => pageMeta(location.pathname, {
  titleZh: '产品中心｜宫颈癌、子宫内膜癌、卵巢癌甲基化检测 | CISPOLY 聚禾生物',
  titleEn: 'Gynecologic Cancer Methylation Tests | CISPOLY',
  descriptionZh:
    '聚禾生物三大核心产品：禾宫康 CISCER®（宫颈癌 PAX1/JAM3）、禾蔻安 CISENDO®（子宫内膜癌 CDO1/CELF4）、禾薇益 CISOVA®（卵巢癌 CDO1/HOXA9），均为 NMPA III 类注册的无创甲基化检测。',
  descriptionEn:
    'CISPOLY’s three NMPA Class III registered non-invasive DNA methylation tests: CISCER® for cervical cancer and HPV-positive triage, CISENDO® for endometrial cancer, CISOVA® for ovarian cancer. Compare genes, samples and clinical performance.',
  image: PAGE_HERO_IMAGES.products,
  structuredData: [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'CISPOLY gynecologic cancer methylation tests',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.fullNameEn || p.fullName,
        url: `https://www.cispoly.com/products/${p.slug}/`,
      })),
    },
    breadcrumbSchema([{ name: '产品中心', path: '/products' }], location.pathname),
  ],
})

export default function ProductsIndex() {
  const { lang } = useI18n()
  const en = lang === 'en'

  const copy = en
    ? {
        eyebrow: 'Product Portfolio',
        title: 'Three non-invasive tests for the three major gynecologic cancers',
        subtitle:
          'One DNA methylation platform, three NMPA Class III registered IVDs — cervical, endometrial and ovarian cancer. Every test uses non-invasive sampling and is backed by published multi-center clinical data.',
        portfolioEyebrow: 'The portfolio',
        portfolioTitle: 'Pick the test that matches your clinical pathway',
        compareEyebrow: 'Comparison',
        compareTitle: 'Compare the three tests at a glance',
        compareNote:
          'Sensitivity and specificity are from the registered clinical trials. Registration numbers are NMPA Class III IVD registrations.',
        colTest: 'Test',
        colCancer: 'Cancer',
        colGenes: 'Genes',
        colSample: 'Sample',
        colSens: 'Sensitivity',
        colSpec: 'Specificity',
        colReg: 'NMPA registration',
        ctaTitle: 'Need the IFU, a distributor quote or a validation study?',
        ctaDesc:
          'Tell us your laboratory setup and intended use. We reply within 1–2 business days with documents, performance data and collaboration options.',
        ctaPrimary: 'Request product information',
        ctaSecondary: 'Talk to our clinical team',
        ctaBullets: ['IFU and registration certificates', 'Clinical performance summary', 'Distributor and study collaboration terms'],
      }
    : {
        eyebrow: '产品矩阵 · Products',
        title: '三大核心产品，覆盖妇科三大恶性肿瘤',
        subtitle:
          '同一 DNA 甲基化技术平台，三款 NMPA III 类注册产品——宫颈癌、子宫内膜癌、卵巢癌。全部无创采样，均有已发表的多中心临床数据支持。',
        portfolioEyebrow: '产品矩阵',
        portfolioTitle: '按临床路径选择对应的检测',
        compareEyebrow: '参数对比',
        compareTitle: '三大产品一览',
        compareNote: '灵敏度与特异性数据来自注册临床试验；注册证号为国械注准 III 类体外诊断试剂。',
        colTest: '产品',
        colCancer: '癌种',
        colGenes: '基因',
        colSample: '样本',
        colSens: '灵敏度',
        colSpec: '特异性',
        colReg: '注册证号',
        ctaTitle: '需要说明书、代理报价或临床验证方案？',
        ctaDesc: '告知您的实验室条件与使用场景，我们将在 1–2 个工作日内提供资料、效能数据与合作方式。',
        ctaPrimary: '获取产品资料',
        ctaSecondary: '联系临床团队',
        ctaBullets: ['说明书与注册证', '临床效能数据摘要', '代理与临床研究合作政策'],
      }

  const rows = products.map((p) => {
    const metrics = pick(p.metrics, p.metricsEn || p.metrics, lang)
    return {
      slug: p.slug,
      name: pick(p.fullName, p.fullNameEn || p.fullName, lang),
      cancer: pick(p.cancer, p.cancerEn || p.cancer, lang),
      genes: p.genes.join(' / '),
      sample: pick(p.sampleType, p.sampleTypeEn || p.sampleType, lang),
      sens: metrics[0]?.value ?? '—',
      spec: metrics[1]?.value ?? '—',
      reg: en ? p.registration.replace(/^国械注准\s*/, '') : p.registration,
    }
  })

  return (
    <div>
      <PageHero
        image={PAGE_HERO_IMAGES.products}
        eyebrow={copy.eyebrow}
        title={copy.title}
        subtitle={copy.subtitle}
      >
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/contact" className="btn-primary">
            <Mail size={16} /> {copy.ctaPrimary}
          </Link>
          <Link to="/papers" className="btn-ghost">
            {en ? 'Browse clinical evidence' : '查看临床证据'} <ArrowRight size={16} />
          </Link>
        </div>
      </PageHero>

      {/* ===== 三大产品卡 ===== */}
      <section className="py-16 md:py-24">
        <div className="shell">
          <SectionTitle eyebrow={copy.portfolioEyebrow} title={copy.portfolioTitle} />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 参数对比表 ===== */}
      <section className="bg-white py-16 md:py-24">
        <div className="shell">
          <SectionTitle eyebrow={copy.compareEyebrow} title={copy.compareTitle} subtitle={copy.compareNote} />
          <Reveal>
            <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-canvas/60 text-xs uppercase tracking-wider text-inkSoft">
                    <th className="px-5 py-4 font-semibold">{copy.colTest}</th>
                    <th className="px-5 py-4 font-semibold">{copy.colCancer}</th>
                    <th className="px-5 py-4 font-semibold">{copy.colGenes}</th>
                    <th className="px-5 py-4 font-semibold">{copy.colSample}</th>
                    <th className="px-5 py-4 font-semibold">{copy.colSens}</th>
                    <th className="px-5 py-4 font-semibold">{copy.colSpec}</th>
                    <th className="px-5 py-4 font-semibold">{copy.colReg}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.slug} className="border-t border-line align-top">
                      <td className="px-5 py-5">
                        <Link to={`/products/${r.slug}`} className="font-semibold text-ink hover:text-brand-600">
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-5 py-5 text-ink/80">{r.cancer}</td>
                      <td className="px-5 py-5 font-mono text-[13px] text-ink/80">{r.genes}</td>
                      <td className="px-5 py-5 text-[13px] text-inkSoft">{r.sample}</td>
                      <td className="px-5 py-5 font-mono font-semibold text-brand-600">{r.sens}</td>
                      <td className="px-5 py-5 font-mono font-semibold text-brand-600">{r.spec}</td>
                      <td className="px-5 py-5 font-mono text-[13px] text-ink/70">{r.reg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== 询盘入口 ===== */}
      <section className="pb-20 pt-4 md:pb-28">
        <div className="shell">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 px-6 py-10 md:px-12 md:py-14">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="relative grid gap-10 md:grid-cols-[1.5fr_1fr] md:items-center">
                <div className="text-white">
                  <h2 className="text-2xl font-bold leading-snug tracking-tight md:text-3xl">{copy.ctaTitle}</h2>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">{copy.ctaDesc}</p>
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
                  <a
                    href="mailto:OPBT@cispoly.com"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {copy.ctaSecondary} <ArrowRight size={16} />
                  </a>
                  <p className="mt-1 inline-flex items-center justify-center gap-1.5 text-center text-xs text-white/70">
                    <ShieldCheck size={14} /> {en ? 'NMPA Class III registered IVDs' : 'NMPA III 类注册体外诊断试剂'}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
