import PageHero from '@/components/PageHero'
import { PAGE_HERO_IMAGES } from '@/lib/images'
import { useI18n } from '@/lib/i18n'
import type { MetaFunction } from 'react-router'
import { pageMeta } from '@/lib/seo'

export const meta: MetaFunction = ({ location }) => pageMeta(location.pathname, {
  titleZh: '隐私政策 | CISPOLY',
  titleEn: 'Privacy Policy | CISPOLY',
  descriptionZh: '聚禾生物隐私政策：说明本网站收集哪些信息、如何使用与保护这些信息，以及您的权利。',
  descriptionEn: 'CISPOLY privacy policy: what information this website collects, how it is used and protected, and your rights.',
})

const SECTIONS_ZH = [
  {
    title: '我们收集的信息',
    body: [
      '本网站（www.cispoly.com）默认不收集任何可识别个人身份的信息。您可以在不提供任何个人信息的情况下浏览全部公开页面。',
      '当您通过"联系我们"表单提交咨询时，我们会收集您主动填写的姓名、邮箱、电话及咨询内容，仅用于回复您的商务或学术咨询。',
      '联系表单通过第三方服务 Web3Forms 提交与转发，其处理遵循该服务的隐私条款。',
    ],
  },
  {
    title: '信息的使用',
    body: [
      '我们仅将您提交的信息用于：回复您的咨询、提供您所请求的产品或学术资料。',
      '我们不会向任何第三方出售、出租或交换您的个人信息，法律法规要求的除外。',
    ],
  },
  {
    title: 'Cookie 与本地存储',
    body: [
      '本网站使用浏览器本地存储（localStorage）记住您的语言偏好（中文/英文），该数据仅保存在您的设备上，不传输到我们的服务器。',
      '本网站不使用广告跟踪类 Cookie。',
    ],
  },
  {
    title: '信息安全',
    body: [
      '全站启用 HTTPS 加密传输。我们采取合理的技术与管理措施保护您提交的信息，防止未经授权的访问、披露或篡改。',
      '如您发现自己的个人信息被未经授权使用，或需要更正、删除已提交的信息，请通过 OPBT@cispoly.com 联系我们，我们将在合理期限内处理。',
    ],
  },
  {
    title: '政策更新',
    body: [
      '本政策可能不时更新，更新后将在本页面发布并注明生效日期。',
    ],
  },
]

const SECTIONS_EN = [
  {
    title: 'Information We Collect',
    body: [
      'This website (www.cispoly.com) does not collect personally identifiable information by default. You can browse all public pages without providing any personal data.',
      'When you submit an inquiry through the "Contact Us" form, we collect the name, email, phone number, and message content you voluntarily provide, solely to respond to your business or academic inquiry.',
      'The contact form is submitted and relayed through the third-party service Web3Forms, whose handling follows that service\'s privacy terms.',
    ],
  },
  {
    title: 'How Information Is Used',
    body: [
      'We use the information you submit only to: respond to your inquiry, and provide the product or academic materials you requested.',
      'We do not sell, rent, or exchange your personal information with any third party, except where required by law.',
    ],
  },
  {
    title: 'Cookies and Local Storage',
    body: [
      'This website uses browser localStorage to remember your language preference (Chinese/English). This data stays on your device and is never transmitted to our servers.',
      'This website does not use advertising or tracking cookies.',
    ],
  },
  {
    title: 'Information Security',
    body: [
      'The entire site is served over HTTPS. We take reasonable technical and organizational measures to protect the information you submit from unauthorized access, disclosure, or alteration.',
      'If you believe your personal information has been used without authorization, or you need to correct or delete information you have submitted, contact us at OPBT@cispoly.com and we will address it within a reasonable period.',
    ],
  },
  {
    title: 'Policy Updates',
    body: [
      'This policy may be updated from time to time. Updates will be posted on this page with the effective date.',
    ],
  },
]

export default function Privacy() {
  const { lang } = useI18n()
  const sections = lang === 'en' ? SECTIONS_EN : SECTIONS_ZH
  const labels = {
    zh: {
      eyebrow: '法律声明 · Legal',
      title: '隐私政策',
      updated: '更新日期：2026 年 10 月 21 日',
      intro:
        '北京起源聚禾生物科技有限公司（下称"我们"）尊重并保护用户隐私。本政策说明本网站收集哪些信息、如何使用与保护这些信息，以及您拥有的权利。使用本网站即表示您已阅读并同意本政策。',
      contact: '如对本政策有任何疑问，请联系：',
    },
    en: {
      eyebrow: 'Legal',
      title: 'Privacy Policy',
      updated: 'Last updated: October 21, 2026',
      intro:
        'Beijing Origin-Poly Biotechnology Co., Ltd. ("we") respects and protects user privacy. This policy explains what information this website collects, how it is used and protected, and your rights. By using this website, you have read and agreed to this policy.',
      contact: 'Questions about this policy:',
    },
  }[lang === 'en' ? 'en' : 'zh']

  return (
    <div>
      <PageHero
        image={PAGE_HERO_IMAGES.contact}
        eyebrow={labels.eyebrow}
        title={labels.title}
        subtitle={labels.updated}
      />
      <section className="bg-white py-16 md:py-24">
        <div className="shell max-w-3xl">
          <p className="text-[15px] leading-relaxed text-ink/80">{labels.intro}</p>
          {sections.map((section, i) => (
            <div key={i} className="mt-10">
              <h2 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
                {i + 1}. {section.title}
              </h2>
              <div className="mt-4 space-y-3">
                {section.body.map((para, j) => (
                  <p key={j} className="text-[15px] leading-relaxed text-ink/80">{para}</p>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-12 border-t border-line pt-8 text-sm text-inkSoft">
            {labels.contact} <a className="text-brand-600 hover:underline" href="mailto:OPBT@cispoly.com">OPBT@cispoly.com</a>
          </div>
        </div>
      </section>
    </div>
  )
}
