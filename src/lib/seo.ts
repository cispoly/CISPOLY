import type { MetaDescriptor } from 'react-router'

const SITE_ORIGIN = 'https://www.cispoly.com'

interface PageMetaOptions {
  titleZh: string
  titleEn: string
  descriptionZh: string
  descriptionEn: string
  image?: string
  type?: 'website' | 'article'
  structuredData?: Record<string, unknown>
}

export function isEnglishPath(pathname: string) {
  return pathname === '/en' || pathname.startsWith('/en/')
}

export function pageMeta(pathname: string, options: PageMetaOptions): MetaDescriptor[] {
  const english = isEnglishPath(pathname)
  const title = english ? options.titleEn : options.titleZh
  const description = english ? options.descriptionEn : options.descriptionZh
  const barePath = pathname.replace(/^\/en(?=\/|$)/, '') || '/'
  const zhUrl = new URL(barePath, SITE_ORIGIN).href
  const enUrl = new URL(barePath === '/' ? '/en' : `/en${barePath}`, SITE_ORIGIN).href
  const canonical = english ? enUrl : zhUrl

  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: options.type || 'website' },
    { property: 'og:url', content: canonical },
    { property: 'og:locale', content: english ? 'en_US' : 'zh_CN' },
    ...(options.image ? [{ property: 'og:image', content: new URL(options.image, SITE_ORIGIN).href }] : []),
    { name: 'twitter:card', content: options.image ? 'summary_large_image' : 'summary' },
    { tagName: 'link', rel: 'canonical', href: canonical },
    { tagName: 'link', rel: 'alternate', hrefLang: 'zh-CN', href: zhUrl },
    { tagName: 'link', rel: 'alternate', hrefLang: 'en', href: enUrl },
    { tagName: 'link', rel: 'alternate', hrefLang: 'x-default', href: zhUrl },
    ...(options.structuredData ? [{ 'script:ld+json': options.structuredData }] : []),
  ]
}
