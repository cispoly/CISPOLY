import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import PosterDetail from '@/components/PosterDetail'
import { getGuideline, guidelines, loadPdfFields } from '@/lib/data'
import type { PdfParsedFields } from '@/lib/data'
import { useI18n } from '@/lib/i18n'
import { getCancerLabel } from '@/types'

export default function GuidelineDetail() {
  const { t, lang } = useI18n()
  const { cancer, id } = useParams()
  const guideline = cancer && id ? getGuideline(cancer as never, id) : undefined
  const [parsed, setParsed] = useState<PdfParsedFields | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    let alive = true
    loadPdfFields(id).then((f) => alive && setParsed(f))
    return () => {
      alive = false
    }
  }, [id])

  if (!guideline) return <Navigate to="/guidelines" replace />

  const title = parsed?.title || (lang === 'en' && guideline.titleEn ? guideline.titleEn : guideline.title)
  const doi = parsed?.doi || guideline.doi
  const affiliation = lang === 'en' && guideline.publisherEn ? guideline.publisherEn : (parsed?.affiliation || guideline.publisher)
  const abstract = parsed?.abstract || (lang === 'en' ? (guideline.abstractEn || guideline.excerptEn || guideline.abstract) : guideline.abstract)
  const citation = guideline.citation || ''

  const siblings = guidelines.filter((g) => g.cancer === guideline.cancer)
  const idx = siblings.findIndex((g) => g.id === guideline.id)
  const prev = idx > 0 ? siblings[idx - 1] : null
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null

  const posterUrl = `/posters/${guideline.cancer}/${encodeURIComponent(guideline.id)}/poster.html`
  const cancerLabelTranslated = getCancerLabel(guideline.cancer, lang)

  return (
    <PosterDetail
      backTo="/guidelines"
      backLabel={t('common.backToGuidelines')}
      cancerLabel={cancerLabelTranslated}
      title={title}
      affiliation={affiliation || undefined}
      journal={guideline.publisher || undefined}
      year={guideline.year}
      doi={doi}
      citation={citation || undefined}
      abstract={abstract || undefined}
      posterUrl={posterUrl}
      posterTitle={guideline.title}
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
