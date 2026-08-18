import { useState } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import PageHero from '@/components/PageHero'
import Reveal from '@/components/Reveal'
import { company } from '@/lib/data/company'
import { PAGE_HERO_IMAGES } from '@/lib/images'
import { useI18n, pick } from '@/lib/i18n'
import type { MetaFunction } from 'react-router'
import { pageMeta } from '@/lib/seo'

export const meta: MetaFunction = ({ location }) => pageMeta(location.pathname, {
  titleZh: '联系我们 | CISPOLY 聚禾生物',
  titleEn: 'Contact CISPOLY',
  descriptionZh: '联系聚禾生物，咨询医疗机构合作、产品信息、科研合作与商务机会。',
  descriptionEn: 'Contact CISPOLY for clinical partnerships, product information, research collaboration, and business inquiries.',
})

type SubmitState = 'idle' | 'sending' | 'success' | 'error'

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

// Access Key 通过 VITE_WEB3FORMS_ACCESS_KEY 注入（见 .env.local，不提交到仓库）。
// 注册地址：https://web3forms.com → 填写收件邮箱激活后即可获得 key。
const accessKey = (import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string | undefined)?.trim() || ''
const ACCESS_KEY_PLACEHOLDER = 'YOUR_WEB3FORMS_ACCESS_KEY_HERE'
const configured = accessKey.length > 0 && accessKey !== ACCESS_KEY_PLACEHOLDER

export default function Contact() {
  const { t, lang } = useI18n()
  const [state, setState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const companyLoc = pick(company.location, company.locationEn || company.location, lang)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!configured || state === 'sending') return

    const form = e.currentTarget
    const fd = new FormData(form)
    const botcheck = String(fd.get('botcheck') || '').trim()

    // honeypot 被填写 → 机器人，假装成功但不发送
    if (botcheck) {
      setState('success')
      form.reset()
      window.setTimeout(() => setState('idle'), 6000)
      return
    }

    const name = String(fd.get('name') || '')
    setState('sending')
    setErrorMsg('')

    try {
      const payload = {
        access_key: accessKey,
        subject:
          lang === 'zh'
            ? `官网咨询：${name}`
            : `Website inquiry from ${name}`,
        from_name: 'CISPOLY Official Website',
        name,
        contact: String(fd.get('contact') || ''),
        org: String(fd.get('org') || ''),
        message: String(fd.get('message') || ''),
        botcheck: '',
      }
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setState('success')
        form.reset()
        window.setTimeout(() => setState('idle'), 6000)
      } else {
        setState('error')
        setErrorMsg(data.message || t('contact.sendError'))
      }
    } catch {
      setState('error')
      setErrorMsg(t('contact.sendError'))
    }
  }

  const inputCls =
    'w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

  return (
    <div>
      <PageHero
        image={PAGE_HERO_IMAGES.about}
        eyebrow={t('contact.hero.eyebrow')}
        title={t('contact.hero.title')}
        subtitle={t('contact.hero.subtitle')}
      />

      <section className="bg-white py-16 md:py-24">
        <div className="shell">
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-14">
            {/* 左：联系信息 */}
            <div className="space-y-6 lg:col-span-2">
              <Reveal>
                <span className="eyebrow">{t('contact.infoEyebrow')}</span>
                <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-ink md:text-3xl">
                  {t('contact.infoTitle')}
                </h2>
                <div className="mt-6 h-px w-16 bg-brand-300" />
                <p className="mt-6 text-sm leading-relaxed text-inkSoft">
                  {t('contact.infoDesc')}
                </p>
              </Reveal>

              <Reveal delay={0.08}>
                <div className="card space-y-5 p-7">
                  <ContactRow
                    icon={<MapPin size={18} />}
                    label={t('contact.addressLabel')}
                    value={companyLoc}
                  />
                  <ContactRow
                    icon={<Phone size={18} />}
                    label={t('contact.phoneLabel')}
                    value={company.phone}
                    href={`tel:${company.phone.replace(/[^+\d]/g, '')}`}
                  />
                  <ContactRow
                    icon={<Mail size={18} />}
                    label={t('contact.emailLabel')}
                    value={company.emails.join('  ·  ')}
                    href={`mailto:${company.emails[0]}`}
                  />
                  <ContactRow
                    icon={<Clock size={18} />}
                    label={t('contact.workTime')}
                    value={t('contact.workTimeValue')}
                  />
                </div>
              </Reveal>

              <Reveal delay={0.16}>
                <a
                  href={`mailto:${company.emails[0]}`}
                  className="btn-ghost w-full justify-center"
                >
                  <Mail size={16} /> {t('contact.directEmail')}
                </a>
              </Reveal>
            </div>

            {/* 右：咨询表单 */}
            <div className="lg:col-span-3">
              <Reveal delay={0.1}>
                <div className="card p-7 md:p-9">
                  <h3 className="text-lg font-semibold text-ink">{t('contact.sendInquiry')}</h3>
                  <p className="mt-1.5 text-sm text-inkSoft">{t('contact.replyTime')}</p>

                  {!configured ? (
                    <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <p>{t('contact.unconfigured')}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate={false}>
                      {/* honeypot：对真人不可见，机器人填了会被静默拦截 */}
                      <input
                        type="text"
                        name="botcheck"
                        tabIndex={-1}
                        autoComplete="off"
                        className="hidden"
                        aria-hidden="true"
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={t('contact.nameLabel')} name="name" placeholder={t('contact.namePlaceholder')} required />
                        <Field label={t('contact.contactLabel')} name="contact" placeholder={t('contact.contactPlaceholder')} required />
                      </div>
                      <Field label={t('contact.orgLabel')} name="org" placeholder={t('contact.orgPlaceholder')} />
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-inkSoft">
                          {t('contact.messageLabel')}
                        </label>
                        <textarea
                          name="message"
                          rows={5}
                          required
                          placeholder={t('contact.messagePlaceholder')}
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      {state === 'error' && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      {state === 'success' && (
                        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                          <span>{t('contact.sentSuccess')}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={state === 'sending'}
                        className="btn-primary w-full disabled:opacity-70"
                      >
                        {state === 'sending' ? (
                          <>
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            {t('contact.sending')}
                          </>
                        ) : (
                          <>
                            <Send size={16} /> {t('contact.sendInquiry')}
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </div>
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
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500/15 text-brand-500">
        {icon}
      </span>
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-inkSoft">{label}</div>
        <div className="mt-0.5 break-all text-sm text-ink/85">{value}</div>
      </div>
    </>
  )

  if (href) {
    return (
      <a href={href} className="flex items-start gap-3.5 transition hover:opacity-80">
        {content}
      </a>
    )
  }
  return <div className="flex items-start gap-3.5">{content}</div>
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string
  name: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-inkSoft">{label}</label>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink/35 transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  )
}
