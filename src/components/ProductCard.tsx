import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Product } from '@/types'
import { useI18n, pick } from '@/lib/i18n'

/**
 * 产品卡 v3 —— 纯排版 · 无图形。
 *
 * 顶部：品牌红渐变 + 基因名超大文字水印（纯 CSS 文字）制造品牌层次；
 * 内容：癌种标签 / 卖点 / 简介 / 关键数据。
 * 配色：品牌赤红渐变 + 暖白 + 深炭文字，克制的红点缀。
 */
export default function ProductCard({ product }: { product: Product }) {
  const { lang } = useI18n()

  const fullName = pick(product.fullName, product.fullNameEn || product.fullName, lang)
  const cancer = pick(product.cancer, product.cancerEn || product.cancer, lang)
  const tagline = pick(product.tagline, product.taglineEn || product.tagline, lang)
  const summary = pick(product.summary, product.summaryEn || product.summary, lang)
  const metrics = pick(product.metrics, product.metricsEn || product.metrics, lang)
  const geneLabel = lang === 'zh' ? '甲基化' : 'methylation'

  return (
    <Link
      to={`/products/${product.slug}`}
      className="card card-hover group flex h-full flex-col overflow-hidden"
    >
      {/* 顶部品牌色块（纯排版 · 无图形） */}
      <div
        className="relative overflow-hidden px-6 pb-7 pt-8"
        style={{
          background:
            'linear-gradient(155deg, #E05C59 0%, #D74B4A 38%, #B33B3A 72%, #A03534 100%)',
        }}
      >
        {/* 左上提亮光晕 / 右下压暗，增强渐变层次 */}
        <div className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-14 -right-10 h-36 w-36 rounded-full bg-black/20 blur-2xl" />

        {/* 基因名超大文字水印（替代图形，制造层次） */}
        <div className="pointer-events-none absolute -bottom-3 right-2 select-none text-[52px] font-black uppercase leading-none tracking-tight text-white/[0.07] transition-opacity duration-500 group-hover:text-white/[0.12]">
          {product.englishName}
        </div>

        {/* 上排：癌种标签 + 箭头 */}
        <div className="relative z-[1] flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {cancer}
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform duration-300 group-hover:rotate-45">
            <ArrowUpRight size={18} />
          </span>
        </div>

        {/* 下排：产品名 + 基因 */}
        <div className="relative z-[1] mt-7">
          <div className="text-[22px] font-bold leading-tight tracking-tight text-white md:text-2xl">
            {fullName}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.25em] text-white/65">
            {product.englishName}
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
            {product.genes.join(' / ')}
            <span className="text-white/60">·</span>
            {geneLabel}
          </div>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-semibold text-ink transition-colors group-hover:text-brand-600">
          {tagline}
        </p>
        <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-inkSoft">
          {summary}
        </p>

        {/* 关键数据 */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5">
          {metrics.slice(0, 2).map((m, i) => (
            <div key={i}>
              <div className="text-xl font-bold tracking-tight text-brand-600">{m.value}</div>
              <div className="mt-0.5 text-[11px] text-inkSoft">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
