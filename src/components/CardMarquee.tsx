import type { ReactNode } from 'react'

/**
 * 卡片轮动条 —— 从右向左无缝轮动。
 *
 * 用法：传入卡片数组，每张卡宽度固定（由 wrapper 的 className 控制）。
 * - 卡片数量 > 3 时轮动，≤3 时静态排列。
 * - hover 暂停，左右渐隐遮罩。
 */
interface CardMarqueeProps {
  children: ReactNode[]
  /** 卡片间距（px） */
  gap?: number
  /** 轮动时长（秒），越小越快 */
  duration?: number
  /** 是否强制轮动（默认按数量自动判断：>3 轮动） */
  auto?: boolean
}

export default function CardMarquee({ children, gap = 24, duration = 60, auto }: CardMarqueeProps) {
  const shouldScroll = auto ?? children.length > 3

  // 复制两份实现无缝循环
  const doubled = [...children, ...children]

  return (
    <div className="relative mt-10 overflow-hidden py-2">
      {shouldScroll ? (
        <>
          {/* 左右渐隐遮罩（仅轮动模式） */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent md:w-16" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent md:w-16" />
          <div
            className="card-marquee-track"
            style={{ gap, animationDuration: `${duration}s` }}
          >
            {doubled.map((child, i) => (
              <div key={i} className="shrink-0">
                {child}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-wrap justify-start gap-6">
          {children.map((child, i) => (
            <div key={i} className="h-full w-[300px] md:w-[340px]">
              {child}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .card-marquee-track {
          display: flex;
          width: max-content;
          animation: card-marquee ${duration}s linear infinite;
        }
        .card-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes card-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-50% - ${gap / 2}px)); }
        }
      `}</style>
    </div>
  )
}
