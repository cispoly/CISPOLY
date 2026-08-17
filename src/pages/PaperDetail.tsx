import { useEffect, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import PosterDetail from '@/components/PosterDetail'
import { getPaper, papers, loadPdfFields } from '@/lib/data'
import type { PdfParsedFields } from '@/lib/data'
import { useI18n } from '@/lib/i18n'
import { getCancerLabel } from '@/types'

export default function PaperDetail() {
  const { t, lang } = useI18n()
  const { cancer, id } = useParams()
  const paper = cancer && id ? getPaper(cancer as never, id) : undefined
  const [parsed, setParsed] = useState<PdfParsedFields | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    let alive = true
    loadPdfFields(id).then((f) => alive && setParsed(f))
    return () => {
      alive = false
    }
  }, [id])

  if (!paper) return <Navigate to="/papers" replace />

  const title = parsed?.title || (lang === 'en' && paper.titleEn ? paper.titleEn : paper.title)
  const doi = parsed?.doi || paper.doi
  const affiliation = lang === 'en' && paper.affiliationEn ? paper.affiliationEn : (parsed?.affiliation || paper.affiliation)
  // 摘要按页面语言选择：英文页有 abstractEn 则用英文，否则回退主摘要；中文页用主摘要（中英双摘要文献主摘要即中文）
  const abstract = lang === 'en' && paper.abstractEn ? paper.abstractEn : (paper.abstract || parsed?.abstract)
  const summary = (lang === 'en' && paper.summaryEn ? paper.summaryEn : paper.summary) || ''
  const citation = paper.citation || ''

  const siblings = papers.filter((p) => p.cancer === paper.cancer)
  const idx = siblings.findIndex((p) => p.id === paper.id)
  const prev = idx > 0 ? siblings[idx - 1] : null
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null

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
