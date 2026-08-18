import type { LoaderFunctionArgs, MetaFunction } from 'react-router'
import { useLoaderData } from '@/lib/router'
import PosterDetail from '@/components/PosterDetail'
import { getPaper, papers } from '@/lib/data/papers'
import { getPdfFields } from '@/lib/content.server'
import { useI18n } from '@/lib/i18n'
import { getCancerLabel } from '@/types'
import { pageMeta } from '@/lib/seo'

export function loader({ params, request }: LoaderFunctionArgs) {
  const paper = params.cancer && params.id ? getPaper(params.cancer as never, params.id) : undefined
  if (!paper) throw new Response('Paper not found', { status: 404 })

  const siblings = papers.filter((item) => item.cancer === paper.cancer)
  const index = siblings.findIndex((item) => item.id === paper.id)
  const fields = getPdfFields(paper.id)
  return {
    paper,
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

export const meta: MetaFunction<typeof loader> = ({ loaderData, location }) => {
  if (!loaderData) return [{ title: 'Research | CISPOLY' }]
  const { paper, lang } = loaderData
  const title = lang === 'en' && paper.titleEn ? paper.titleEn : paper.title
  return pageMeta(location.pathname, {
    titleZh: `${paper.title} | CISPOLY Research`,
    titleEn: `${paper.titleEn || paper.title} | CISPOLY Research`,
    descriptionZh: paper.excerpt,
    descriptionEn: paper.abstractEn || paper.excerpt,
    image: paper.cover,
    type: 'article',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      headline: title,
      author: paper.authors,
      datePublished: paper.year ? String(paper.year) : undefined,
      isPartOf: paper.journal,
    },
  })
}

export default function PaperDetail() {
  const { t, lang } = useI18n()
  const { paper, parsed, prev, next } = useLoaderData<typeof loader>()

  const title = parsed?.title || (lang === 'en' && paper.titleEn ? paper.titleEn : paper.title)
  const doi = parsed?.doi || paper.doi
  const affiliation = lang === 'en' && paper.affiliationEn ? paper.affiliationEn : (parsed?.affiliation || paper.affiliation)
  // 摘要按页面语言选择：英文页有 abstractEn 则用英文，否则回退主摘要；中文页用主摘要（中英双摘要文献主摘要即中文）
  const abstract = lang === 'en' && paper.abstractEn ? paper.abstractEn : (paper.abstract || parsed?.abstract)
  const summary = (lang === 'en' && paper.summaryEn ? paper.summaryEn : paper.summary) || ''
  const citation = paper.citation || ''

  const posterUrl = `/posters/${paper.cancer}/${encodeURIComponent(paper.id)}/poster.html`
  const cancerLabelTranslated = getCancerLabel(paper.cancer, lang)

  return (
    <PosterDetail
      backTo="/papers"
      backLabel={t('common.backToPapers')}
      cancerLabel={cancerLabelTranslated}
      title={title}
      authors={paper.authors || undefined}
      affiliation={affiliation || undefined}
      journal={paper.journal || undefined}
      year={paper.year}
      doi={doi}
      citation={citation || undefined}
      abstract={abstract || undefined}
      summary={summary || undefined}
      posterUrl={posterUrl}
      posterTitle={paper.title}
      prev={
        prev
          ? { to: `/papers/${prev.cancer}/${prev.id}`, title: lang === 'en' && prev.titleEn ? prev.titleEn : prev.title }
          : null
      }
      next={
        next
          ? { to: `/papers/${next.cancer}/${next.id}`, title: lang === 'en' && next.titleEn ? next.titleEn : next.title }
          : null
      }
    />
  )
}
