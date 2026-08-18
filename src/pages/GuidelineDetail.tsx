import type { LoaderFunctionArgs, MetaFunction, ShouldRevalidateFunctionArgs } from 'react-router'
import { useLoaderData } from '@/lib/router'
import PosterDetail from '@/components/PosterDetail'
import { getGuideline, guidelines } from '@/lib/data/guidelines'
import { getPdfFields } from '@/lib/content.server'
import { useI18n } from '@/lib/i18n'
import { getCancerLabel } from '@/types'
import { pageMeta } from '@/lib/seo'

export function loader({ params, request }: LoaderFunctionArgs) {
  const guideline = params.cancer && params.id ? getGuideline(params.cancer as never, params.id) : undefined
  if (!guideline) throw new Response('Guideline not found', { status: 404 })

  const siblings = guidelines.filter((item) => item.cancer === guideline.cancer)
  const index = siblings.findIndex((item) => item.id === guideline.id)
  const fields = getPdfFields(guideline.id)
  return {
    guideline,
    parsed: fields ? {
      title: fields.title,
      doi: fields.doi,
      affiliation: fields.affiliation,
      abstract: fields.abstract,
    } : undefined,
    prev: index > 0 ? siblings[index - 1] : null,
    next: index < siblings.length - 1 ? siblings[index + 1] : null,
    lang: new URL(request.url).pathname.startsWith('/en/') ? 'en' as const : 'zh' as const,
  }
}

// The optional `en?` route segment is not a route param, so keep language-
// dependent loader metadata in sync when switching URL variants.
export function shouldRevalidate({ currentUrl, nextUrl }: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname !== nextUrl.pathname
}

export const meta: MetaFunction<typeof loader> = ({ loaderData, location }) => {
  if (!loaderData) return [{ title: 'Guidelines | CISPOLY' }]
  const { guideline, lang } = loaderData
  const title = lang === 'en' && guideline.titleEn ? guideline.titleEn : guideline.title
  return pageMeta(location.pathname, {
    titleZh: `${guideline.title} | CISPOLY Guidelines`,
    titleEn: `${guideline.titleEn || guideline.title} | CISPOLY Guidelines`,
    descriptionZh: guideline.excerpt,
    descriptionEn: guideline.excerptEn || guideline.excerpt,
    image: guideline.cover,
    type: 'article',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'MedicalGuideline',
      name: title,
      datePublished: guideline.year ? String(guideline.year) : undefined,
      publisher: guideline.publisher,
    },
  })
}

export default function GuidelineDetail() {
  const { t, lang } = useI18n()
  const { guideline, parsed, prev, next } = useLoaderData<typeof loader>()

  const title = lang === 'en' && guideline.titleEn ? guideline.titleEn : (parsed?.title || guideline.title)
  const doi = parsed?.doi || guideline.doi
  const affiliation = lang === 'en' && guideline.publisherEn ? guideline.publisherEn : (parsed?.affiliation || guideline.publisher)
  const abstract = lang === 'en'
    ? (guideline.abstractEn || guideline.excerptEn || '')
    : (parsed?.abstract || guideline.abstract)
  const citation = lang === 'en' && /[\u3400-\u9fff]/.test(guideline.citation || '')
    ? ''
    : (guideline.citation || '')
  const journal = lang === 'en' ? (guideline.publisherEn || guideline.publisher) : guideline.publisher

  const posterUrl = `/posters/${guideline.cancer}/${encodeURIComponent(guideline.id)}/poster.html`
  const cancerLabelTranslated = getCancerLabel(guideline.cancer, lang)

  return (
    <PosterDetail
      backTo="/guidelines"
      backLabel={t('common.backToGuidelines')}
      cancerLabel={cancerLabelTranslated}
      title={title}
      affiliation={affiliation || undefined}
      journal={journal || undefined}
      year={guideline.year}
      doi={doi}
      citation={citation || undefined}
      abstract={abstract || undefined}
      posterUrl={posterUrl}
      posterTitle={title}
      prev={
        prev
          ? { to: `/guidelines/${prev.cancer}/${prev.id}`, title: lang === 'en' && prev.titleEn ? prev.titleEn : prev.title }
          : null
      }
      next={
        next
          ? { to: `/guidelines/${next.cancer}/${next.id}`, title: lang === 'en' && next.titleEn ? next.titleEn : next.title }
          : null
      }
    />
  )
}
