import type { ReactNode } from 'react'

interface PageHeroProps {
  image: string
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
}

/**
 * 通用页面首视图：毛玻璃图片背景 + 标题。
 * 明色系遮罩（暖白半透 + backdrop-blur），保证文字可读。
 */
export default function PageHero({ image, eyebrow, title, subtitle, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* 图片背景 */}
      <div className="absolute inset-0">
        <img src={image} alt="" className="h-full w-full object-cover" loading="eager" />
      </div>
      {/* 毛玻璃遮罩（明色系，提高透明度让图片更透出） */}
      <div className="absolute inset-0 bg-canvas/35 backdrop-blur-md" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-canvas/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas to-transparent" />

      {/* 内容 */}
      <div className="shell relative z-10 pt-32 pb-14 md:pt-36 md:pb-16">
        <div className="max-w-3xl">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight text-ink md:text-5xl">{title}</h1>
          {subtitle && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/70 md:text-lg">{subtitle}</p>
          )}
          {children}
        </div>
      </div>
    </section>
  )
}
