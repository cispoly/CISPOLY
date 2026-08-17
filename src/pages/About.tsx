import { Link } from 'react-router-dom'
import { Award, Lightbulb, ArrowRight, Calendar, Microscope, Building2 } from 'lucide-react'
import SectionTitle from '@/components/SectionTitle'
import Reveal from '@/components/Reveal'
import PageHero from '@/components/PageHero'
import { company } from '@/lib/data'
import { PAGE_HERO_IMAGES } from '@/lib/images'
import { useI18n, pick } from '@/lib/i18n'

export default function About() {
  const { t, lang } = useI18n()

  const companyName = pick(company.name, company.nameEn || company.name, lang)
  const companyMission = pick(company.mission, company.missionEn || company.mission, lang)
  const companyDesc = pick(company.description, company.descriptionEn || company.description, lang)
  const stats = pick(company.stats, company.statsEn || company.stats, lang)
  const milestones = pick(company.milestones, company.milestonesEn || company.milestones, lang)
  const qualifications = pick(company.qualifications, company.qualificationsEn || company.qualifications, lang)

  return (
    <div>
      <PageHero
        image={PAGE_HERO_IMAGES.about}
        eyebrow={t('about.hero.eyebrow')}
        title={companyName}
        subtitle={companyMission}
      />

      {/* 企业介绍正文 */}
      <section className="bg-white py-16 md:py-24">
        <div className="shell">
          <div className="grid gap-10 md:grid-cols-12 md:gap-14">
            {/* 标题锚点 */}
            <div className="md:col-span-5 lg:col-span-4">
              <Reveal>
                <span className="eyebrow">{t('about.intro.eyebrow')}</span>
                <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-ink md:text-[1.75rem]">
                  {t('about.intro.title')}
                </h2>
                <div className="mt-6 h-px w-16 bg-brand-300" />
                <p className="mt-6 text-sm leading-relaxed text-inkSoft">
                  {t('about.intro.lead')}
                </p>
              </Reveal>
            </div>
            {/* 正文 + 元信息 */}
            <div className="md:col-span-7 lg:col-span-8">
              <Reveal delay={0.1}>
                <p className="text-base leading-loose text-ink/80 md:text-lg">
                  {companyDesc}
                </p>
                {/* 元信息条 */}
                <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-6">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Calendar size={15} className="text-brand-400" />
                    <span className="text-inkSoft">{t('about.intro.foundedLabel')}</span>
                    <span className="font-mono font-bold text-ink">{company.founded}</span>
                  </span>
                  <span className="hidden h-4 w-px bg-line sm:block" />
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Microscope size={15} className="text-brand-400" />
                    <span className="text-inkSoft">{t('about.intro.focusLabel')}</span>
                    <span className="font-medium text-ink/80">{t('about.intro.focusValue')}</span>
                  </span>
                  <span className="hidden h-4 w-px bg-line sm:block" />
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Building2 size={15} className="text-brand-400" />
                    <span className="text-inkSoft">{t('about.intro.brandLabel')}</span>
                    <span className="font-mono font-bold tracking-wider text-brand-500">{company.english}</span>
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 数据看板 */}
      <section className="bg-white py-16 md:py-24">
        <div className="shell">
          <SectionTitle eyebrow={t('about.stats.eyebrow')} title={t('about.stats.title')} />
          <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {stats.map((s, i) => (
              <Reveal key={i} delay={i * 0.06} className="h-full">
                <div className="card flex h-full flex-col items-center justify-center p-6 text-center">
                  <div className="font-mono text-3xl font-bold tracking-tight text-brand-500">
                    {s.value}
                    {lang === 'en' && /[a-zA-Z0-9]$/.test(s.value) && /^[a-zA-Z]/.test(s.unit) ? ' ' : ''}
                    <span className="text-base font-semibold text-inkSoft">{s.unit}</span>
                  </div>
                  <div className="mt-2 text-xs leading-snug text-inkSoft">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 发展历程 */}
      <section className="py-16 md:py-24">
        <div className="shell">
          <SectionTitle eyebrow={t('about.milestones.eyebrow')} title={t('about.milestones.title')} />
          <div className="mt-12 space-y-0">
            {milestones.map((m, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-500 font-mono text-xs font-bold text-white">
                      {m.year}
                    </div>
                    {i < milestones.length - 1 && <div className="w-px flex-1 bg-line" />}
                  </div>
                  <div className="pb-12 pt-3">
                    <p className="text-base leading-relaxed text-ink/85">{m.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 资质荣誉 */}
      <section className="bg-white py-16 md:py-24">
        <div className="shell">
          <SectionTitle
            eyebrow={t('about.qualifications.eyebrow')}
            title={t('about.qualifications.title')}
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {qualifications.map((q, i) => (
              <Reveal key={i} delay={i * 0.06} className="h-full">
                <div className="card flex h-full items-center gap-3 p-5 text-left">
                  <Award size={20} className="shrink-0 text-brand-400" />
                  <span className="text-[14px] font-medium leading-relaxed text-ink/85">{q}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 愿景 CTA */}
      <section className="py-20 md:py-28">
        <div className="shell">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center text-white md:px-16">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
              <div className="relative">
                <Lightbulb className="mx-auto mb-5 text-brand-300" size={36} strokeWidth={1.5} />
                <h2 className="mx-auto max-w-2xl text-2xl font-bold leading-tight md:text-3xl">
                  {lang === 'zh' ? (
                    <>
                      {t('about.cta.title1')}
                      <br />
                      {t('about.cta.title2')}
                    </>
                  ) : (
                    <>{t('about.cta.title1')} {t('about.cta.title2')}</>
                  )}
                </h2>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <Link to="/products/ciscer" className="btn-primary">
                    {t('about.cta.products')} <ArrowRight size={16} />
                  </Link>
                  <Link to="/contact" className="btn-ghost border-white/20 text-white hover:text-white">
                    {t('common.contactConsult')}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
