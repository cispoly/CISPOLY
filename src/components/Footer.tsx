import { Link } from '@/lib/router'
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react'
import { company } from '@/lib/data/company'
import { products } from '@/lib/data/products'
import { useI18n, pick } from '@/lib/i18n'
import type { Product } from '@/types'

export default function Footer() {
  const { t, lang } = useI18n()

  const companyName = pick(company.name, company.nameEn || company.name, lang)
  const companyVision = pick(company.mission, company.missionEn || company.mission, lang)
  const companyLoc = pick(company.location, company.locationEn || company.location, lang)

  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />

      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* 品牌 + 产品入口（占左两列，纵向填满） */}
          <div className="flex flex-col lg:col-span-2">
            <img src="/logo.png" alt="CISPOLY" className="h-9 w-auto shrink-0 self-start brightness-0 invert" />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/55">{companyVision}</p>

            {/* 三个产品入口：flex-1 拉伸填满愿景到分割线之间的区域 */}
            <div className="mt-8 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              {products.map((p) => (
                <FooterProduct key={p.slug} product={p} lang={lang} />
              ))}
            </div>
          </div>

          {/* 联系信息 */}
          <div>
            <h3 className="text-sm font-semibold text-white/85">{t('footer.contactInfo')}</h3>
            <div className="mt-5 space-y-4">
              <ContactRow icon={<MapPin size={16} />} label={t('footer.addressLabel')} value={companyLoc} />
              <ContactRow
                icon={<Phone size={16} />}
                label={t('footer.phoneLabel')}
                value={company.phone}
                href={`tel:${company.phone.replace(/[^+\d]/g, '')}`}
              />
              <ContactRow
                icon={<Mail size={16} />}
                label={t('footer.emailLabel')}
                value={company.emails.join('  ·  ')}
                href={`mailto:${company.emails[0]}`}
              />
            </div>
          </div>

          {/* 快捷链接 */}
          <div>
            <h3 className="text-sm font-semibold text-white/85">{t('footer.quickLinks')}</h3>
            <nav className="mt-5 flex flex-col gap-3">
              <Link to="/" className="text-sm text-white/55 transition hover:text-white/85">
                {t('nav.home')}
              </Link>
              <Link to="/products/ciscer" className="text-sm text-white/55 transition hover:text-white/85">
                {t('footer.linkProducts')}
              </Link>
              <Link to="/papers" className="text-sm text-white/55 transition hover:text-white/85">
                {t('footer.linkPapers')}
              </Link>
              <Link to="/guidelines" className="text-sm text-white/55 transition hover:text-white/85">
                {t('footer.linkGuidelines')}
              </Link>
              <Link to="/blog" className="text-sm text-white/55 transition hover:text-white/85">
                {t('footer.linkBlog')}
              </Link>
              <Link to="/contact" className="text-sm text-white/55 transition hover:text-white/85">
                {t('footer.linkContact')}
              </Link>
            </nav>
          </div>
        </div>

        {/* 底栏 */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/40 md:flex-row">
          <p>
            © {new Date().getFullYear()} {companyName}
            {lang === 'zh' ? '（CISPOLY）' : ' (CISPOLY)'}
            {t('common.copyOf') ? '· ' + t('common.copyOf') : ''}
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterProduct({ product, lang }: { product: Product; lang: 'zh' | 'en' }) {
  const name = pick(product.fullName, product.fullNameEn || product.fullName, lang)
  const cancer = pick(product.cancer, product.cancerEn || product.cancer, lang)
  const tagline = pick(product.tagline, product.taglineEn || product.tagline, lang)

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex h-full flex-col justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300/40 hover:bg-white/[0.06] md:p-5"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[15px] font-bold leading-tight text-white/90 transition group-hover:text-white">
            {name}
          </span>
          <ArrowUpRight
            size={15}
            className="shrink-0 text-white/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-300"
          />
        </div>
        <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300/80">
          {cancer}
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/50 transition group-hover:text-white/65">
        {tagline}
      </p>
    </Link>
  )
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  const content = (
    <>
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-300">
        {icon}
      </span>
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-white/40">{label}</div>
        <div className="mt-0.5 break-all text-sm text-white/85">{value}</div>
      </div>
    </>
  )

  if (href) {
    return (
      <a href={href} className="flex items-start gap-3 transition hover:opacity-80">
        {content}
      </a>
    )
  }
  return <div className="flex items-start gap-3">{content}</div>
}
