import type { ReactNode } from 'react'
import Reveal from './Reveal'

interface SectionTitleProps {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  align?: 'left' | 'center'
}

export default function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = 'left',
}: SectionTitleProps) {
  const center = align === 'center'
  return (
    <Reveal>
      <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-4xl'}>
        {eyebrow && (
          <span className={`eyebrow ${center ? 'justify-center' : ''}`}>{eyebrow}</span>
        )}
        <h2 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
        {subtitle && (
          <p className={`mt-4 text-balance text-base leading-relaxed text-inkSoft md:text-lg ${center ? 'mx-auto' : 'max-w-2xl'}`}>
            {subtitle}
          </p>
        )}
      </div>
    </Reveal>
  )
}
