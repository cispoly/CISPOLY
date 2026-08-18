import { useState } from 'react'
import { Link } from '@/lib/router'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, BookMarked, Building2, Check, Copy,
  ExternalLink, FileText, FlaskConical, BarChart3, Quote, Languages,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'

/**
 * PosterDetail v3 —— 文献/指南详情页（7 段结构）
 */

interface PosterDetailProps {
  backTo: string
  backLabel: string
  cancerLabel: string
  title: string
  authors?: string
  affiliation?: string
  journal?: string
  year?: number | null
  doi?: string
  citation?: string
  abstract?: string
  abstractEn?: string
  summary?: string
  posterUrl?: string
  posterTitle?: string
  sections?: Record<string, string>
  figures?: string[]
  children?: React.ReactNode
  prev?: { to: string; title: string } | null
  next?: { to: string; title: string } | null
}

/* ---------- 摘要解析 ---------- */

type AbsBlock = { label: string; text: string; icon: React.ReactNode; color: string }

function parseAbstract(abstract: string, t: (k: string) => string): AbsBlock[] {
  if (!abstract) return []
  const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '')
  const text = stripHtml(abstract).trim()

  const tagRe = /\[(Background|Objective|Methods|Results|Conclusions|Conclusion)\]\s*:?\s*/gi
  const parts: { label: string; text: string }[] = []
  let lastIdx = 0
  let lastLabel = ''
  let m: RegExpExecArray | null
  while ((m = tagRe.exec(text)) !== null) {
    const seg = text.slice(lastIdx, m.index).trim()
    if (lastLabel && seg) parts.push({ label: lastLabel, text: seg })
    lastLabel = m[1].toLowerCase()
    lastIdx = tagRe.lastIndex
  }
  const tail = text.slice(lastIdx).trim()
  if (lastLabel && tail) parts.push({ label: lastLabel, text: tail })

  if (parts.length === 0) {
    const segRe =
      /(?:^|[.。;；\n])\s*(?=(?:Backgrounds?|Methods|Results|Conclusions?|Objectives?|Introduction)[.\s:：/]|目的|方法|结果|结论)/gi
    const marks: { idx: number; label: string }[] = []
    let sm: RegExpExecArray | null
    let prevLastIndex = -1
    while ((sm = segRe.exec(text)) !== null) {
      if (segRe.lastIndex === prevLastIndex || sm.index === prevLastIndex) {
        if (segRe.lastIndex >= text.length) break
        segRe.lastIndex += 1
      }
      prevLastIndex = segRe.lastIndex
      const after = text.slice(sm.index).match(
        /[.。;；\s]*(Backgrounds?|Methods|Results|Conclusions?|Objectives?|Introduction|目的|方法|结果|结论)[.:：/]?/i
      )
      const key = (after ? after[1] : '').toLowerCase()
      const labelMap: Record<string, string> = {
        background: 'background', objective: 'objective', methods: 'methods',
        results: 'results', conclusion: 'conclusions', conclusions: 'conclusions',
        introduction: 'background',
        '目的': 'objective', '方法': 'methods', '结果': 'results', '结论': 'conclusions',
      }
      if (key && labelMap[key]) marks.push({ idx: sm.index, label: labelMap[key] })
    }
    if (marks.length >= 2) {
      for (let i = 0; i < marks.length; i++) {
        const start = marks[i].idx
        const end = i + 1 < marks.length ? marks[i + 1].idx : text.length
        const seg = text.slice(start, end).replace(/^[.。;；\s]+/, '').trim()
        if (seg) parts.push({ label: marks[i].label, text: seg })
      }
    }
  }

  const absMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    background: { label: t('abs.background'), icon: <FileText size={14} />, color: 'from-sky-50 to-sky-100/60 border-sky-200' },
    objective: { label: t('abs.objective'), icon: <Quote size={14} />, color: 'from-brand-50 to-brand-100/50 border-brand-200' },
    methods: { label: t('abs.methods'), icon: <FlaskConical size={14} />, color: 'from-violet-50 to-violet-100/50 border-violet-200' },
    results: { label: t('abs.results'), icon: <BarChart3 size={14} />, color: 'from-emerald-50 to-emerald-100/50 border-emerald-200' },
    conclusions: { label: t('abs.conclusions'), icon: <Quote size={14} />, color: 'from-amber-50 to-amber-100/50 border-amber-200' },
    conclusion: { label: t('abs.conclusions'), icon: <Quote size={14} />, color: 'from-amber-50 to-amber-100/50 border-amber-200' },
  }

  if (parts.length === 0) {
    return [{ label: '', text, icon: null as unknown as React.ReactNode, color: '' }]
  }
  return parts.map((p) => {
    const meta = absMeta[p.label] || absMeta.background
    return { label: meta.label, text: p.text, icon: meta.icon, color: meta.color }
  })
}

/* ---------- 复制按钮 ---------- */

function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        })
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-medium text-inkSoft transition hover:border-brand-200 hover:text-brand-600"
      aria-label={label}
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      {copied ? copiedLabel : label}
    </button>
  )
}

/* ---------- 摘要分段卡片 ---------- */

function AbstractBlocks({ abstract, abstractEn }: { abstract?: string; abstractEn?: string }) {
  const { t } = useI18n()
  if (!abstract && !abstractEn) return null
  const blocks = abstract ? parseAbstract(abstract, t) : []

  // 英文摘要独立区块（中文主摘要下方）
  const enBlock = abstractEn ? (
    <div className={abstract ? 'border-t border-line/80 pt-4' : 'pt-4'}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
        <Languages size={14} />
        <span>Abstract</span>
      </div>
      <p className="mt-1.5 text-[14px] leading-[1.9] text-ink/85">{abstractEn}</p>
    </div>
  ) : null

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 shadow-soft md:p-7"
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-brand-500" />
      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-brand-600">
        <Quote size={14} /> {t('poster.abstractLabel')}
      </h2>
      {blocks.length === 0 && abstract ? (
        <p className="mt-4 text-[14px] leading-[1.9] text-ink/85">{abstract}</p>
      ) : (
        <div className="mt-4 space-y-4">
          {blocks.map((b, i) => (
            <div key={i} className={i > 0 ? 'border-t border-line/80 pt-4' : ''}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-700">
                {b.icon}
                <span>{b.label}</span>
              </div>
              <p className="mt-1.5 text-[14px] leading-[1.9] text-ink/85">{b.text}</p>
            </div>
          ))}
        </div>
      )}
      {enBlock}
    </motion.section>
  )
}

/* ---------- Poster iframe ---------- */

function PosterEmbed({ posterUrl, posterTitle }: { posterUrl: string; posterTitle?: string }) {
  const { t, lang } = useI18n()
  const [loaded, setLoaded] = useState(false)
  const src = posterUrl + (posterUrl.includes('?') ? '&' : '?') + 'lang=' + lang

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-brand-600">
          <BarChart3 size={14} /> {t('poster.posterLabel')}
        </h2>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-4 py-1.5 text-xs font-medium text-brand-600 transition hover:border-brand-200"
        >
          <ExternalLink size={13} /> {t('poster.openInNewTab')}
        </a>
      </div>
      <div className="relative bg-stone-50" style={{ height: '90vh', minHeight: '600px' }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-inkSoft">
            {t('poster.loading')}
          </div>
        )}
        <iframe
          src={src}
          title={posterTitle || t('poster.posterLabel')}
          className="h-full w-full border-0"
          loading="lazy"
          onLoad={() => setLoaded(true)}
        />
      </div>
      <p className="border-t border-line px-6 py-3 text-[11px] leading-relaxed text-inkSoft">
        {t('poster.posterNote')}
      </p>
    </motion.section>
  )
}

/* ---------- 主组件 ---------- */

export default function PosterDetail({
  backTo,
  backLabel,
  cancerLabel,
  title,
  authors,
  affiliation,
  journal,
  year,
  doi,
  citation,
  abstract,
  abstractEn,
  summary,
  posterUrl,
  posterTitle,
  children,
  prev,
  next,
}: PosterDetailProps) {
  const { t } = useI18n()
  const hasMeta = !!(journal || year)
  const citationText = citation || ''

  return (
    <article className="pt-20 md:pt-24">
      {/* ① 标题区 */}
      <header className="relative overflow-hidden border-b border-line bg-white">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-500 via-warm to-brand-300" />
        <div className="shell py-8 md:py-12">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-inkSoft transition hover:text-brand-600"
          >
            <ArrowLeft size={15} /> {backLabel}
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                {cancerLabel}
              </span>
              {hasMeta && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/60">
                  <BookMarked size={13} /> {journal}
                  {year ? ` · ${year}` : ''}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-ink md:text-[2.2rem] md:leading-[1.25]">
              {title}
            </h1>

            {authors && (
              <p className="mt-3 text-sm leading-relaxed text-inkSoft">{authors}</p>
            )}

          </motion.div>
        </div>
      </header>

      <div className="shell py-10 md:py-14">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* ① TL;DR 摘要总结（中文） */}
          {summary && (
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/50 to-white p-6 shadow-soft md:p-7"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-brand-500 to-warm" />
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-brand-600">
                <Quote size={14} /> {t('poster.tldr')}
              </h2>
              <p className="mt-4 text-[15px] leading-[1.9] text-ink/85">{summary}</p>
            </motion.section>
          )}

          {/* ② 摘要分段卡片 */}
          <AbstractBlocks abstract={abstract} abstractEn={abstractEn} />

          {/* ③ 发表单位 + ④ DOI + ⑤ 引用格式 */}
          {(affiliation || doi || citationText) && (
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col gap-3"
            >
              {affiliation && (
                <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-soft sm:flex-row sm:items-center">
                  <h3 className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-600 sm:w-28">
                    <Building2 size={14} /> {t('poster.affiliationLabel')}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-ink/80">{affiliation}</p>
                </div>
              )}
              {doi && (
                <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-soft sm:flex-row sm:items-center">
                  <h3 className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-600 sm:w-28">
                    <ExternalLink size={14} /> DOI
                  </h3>
                  <a
                    href={`https://doi.org/${doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 break-all font-mono text-[13px] text-brand-600 underline-offset-2 transition hover:text-brand-700 hover:underline"
                  >
                    {doi} <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
              )}
              {citationText && (
                <div className="flex flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-soft sm:flex-row sm:items-start">
                  <h3 className="flex shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-600 sm:w-28">
                    <Quote size={14} /> {t('poster.citationLabel')}
                  </h3>
                  <div className="flex flex-1 items-start gap-3">
                    <p className="flex-1 text-[13px] leading-relaxed text-ink/80">{citationText}</p>
                    <CopyButton text={citationText} label={t('poster.copy')} copiedLabel={t('poster.copied')} />
                  </div>
                </div>
              )}
            </motion.section>
          )}

          {/* 附加内容 */}
          {children && <div>{children}</div>}

          {/* ⑥ Poster */}
          {posterUrl && <PosterEmbed posterUrl={posterUrl} posterTitle={posterTitle || title} />}

          {/* ⑦ 上一篇 / 下一篇 */}
          {(prev || next) && (
            <div className="grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
              {prev ? (
                <Link to={prev.to} className="card card-hover group flex items-center gap-3 p-4">
                  <ArrowLeft size={18} className="shrink-0 text-inkSoft transition group-hover:text-brand-500" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-inkSoft">{t('poster.prevArticle')}</div>
                    <div className="line-clamp-2 text-[13px] font-medium text-ink transition group-hover:text-brand-600">
                      {prev.title}
                    </div>
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  to={next.to}
                  className={`card card-hover group flex items-center gap-3 p-4 ${!prev ? 'sm:col-start-2' : ''}`}
                >
                  <div className="ml-auto min-w-0 text-right">
                    <div className="text-[11px] text-inkSoft">{t('poster.nextArticle')}</div>
                    <div className="line-clamp-2 text-[13px] font-medium text-ink transition group-hover:text-brand-600">
                      {next.title}
                    </div>
                  </div>
                  <ArrowRight size={18} className="shrink-0 text-inkSoft transition group-hover:text-brand-500" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
