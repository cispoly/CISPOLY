import { motion } from 'framer-motion'

/**
 * 三大妇科肿瘤的动效 SVG 解剖图解（BioRender 风格 + Framer Motion）。
 *
 * 形态：饱满有机曲线，符合解剖比例（子宫倒梨形、宫颈窄柱、卵巢椭圆）
 * 动效：器官呼吸、病灶脉冲、甲基化点错峰闪烁、ctDNA 旋转
 * props.variant: 'full'（白描边，深色背景）| 'soft'（粉描边，浅色背景）
 * props.animated: 是否启用动效（默认开，卡片用）
 */
type CancerKey = 'cervical' | 'endometrial' | 'ovarian'

interface Props {
  cancer: CancerKey
  variant?: 'full' | 'soft'
  animated?: boolean
}

const EASE = [0.4, 0, 0.6, 1] as const

export default function OrganDiagram({ cancer, variant = 'full', animated = true }: Props) {
  const stroke = variant === 'full' ? '#FFFFFF' : '#B8485E'
  const sOpacity = variant === 'full' ? 0.92 : 0.55

  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <g stroke={stroke} strokeOpacity={sOpacity} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {cancer === 'cervical' && <Cervical animated={animated} />}
        {cancer === 'endometrial' && <Endometrial animated={animated} />}
        {cancer === 'ovarian' && <Ovarian animated={animated} />}
      </g>
    </svg>
  )
}

/* ────────── 动效工具：呼吸、脉冲、闪烁 ────────── */
function Breathing({ children, animated, delay = 0 }: { children: React.ReactNode; animated: boolean; delay?: number }) {
  // 器官整体缓慢呼吸
  return (
    <motion.g
      animate={animated ? { scale: [1, 1.04, 1] } : undefined}
      transition={animated ? { duration: 3.5, repeat: Infinity, ease: EASE, delay } : undefined}
      style={{ transformOrigin: '120px 70px' }}
    >
      {children}
    </motion.g>
  )
}

function Pulse({ children, animated, delay = 0 }: { children: React.ReactNode; animated: boolean; delay?: number }) {
  // 病灶脉冲（透明度 + 轻微放大）
  return (
    <motion.g
      animate={animated ? { scale: [1, 1.12, 1], opacity: [0.55, 0.85, 0.55] } : undefined}
      transition={animated ? { duration: 2, repeat: Infinity, ease: EASE, delay } : undefined}
    >
      {children}
    </motion.g>
  )
}

function Dot({ cx, cy, animated, delay }: { cx: number; cy: number; animated: boolean; delay: number }) {
  // 甲基化采样点：错峰闪烁
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r="2.2"
      fill="white"
      stroke="none"
      animate={animated ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] } : undefined}
      transition={animated ? { duration: 1.8, repeat: Infinity, ease: EASE, delay } : undefined}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    />
  )
}

/* ────────── 饱满器官形态（改进版曲线） ────────── */

/** 子宫体：倒梨形，顶部宫底圆润宽阔，向下收窄 */
function UterusBodyShape({ cx = 120, cy = 60, scale = 1, fill = 'white', fillOpacity = 0.12 }) {
  const s = scale
  const d = [
    `M${cx - 36 * s} ${cy + 8 * s}`,
    `C${cx - 40 * s} ${cy - 30 * s} ${cx - 24 * s} ${cy - 44 * s} ${cx} ${cy - 44 * s}`,
    `C${cx + 24 * s} ${cy - 44 * s} ${cx + 40 * s} ${cy - 30 * s} ${cx + 36 * s} ${cy + 8 * s}`,
    `C${cx + 32 * s} ${cy + 24 * s} ${cx + 17 * s} ${cy + 30 * s} ${cx} ${cy + 30 * s}`,
    `C${cx - 17 * s} ${cy + 30 * s} ${cx - 32 * s} ${cy + 24 * s} ${cx - 36 * s} ${cy + 8 * s}`,
    'Z',
  ].join(' ')
  return <path d={d} fill={fill} fillOpacity={fillOpacity} />
}

/** 宫颈+阴道：从宫体底部向下的窄管，末端略外扩 */
function CervixCanalShape({ cx = 120, top = 90, fill = 'white', fillOpacity = 0.12 }) {
  const d = [
    `M${cx - 14} ${top}`,
    `C${cx - 15} ${top + 14} ${cx - 16} ${top + 30} ${cx - 17} ${top + 44}`,
    `L${cx + 17} ${top + 44}`,
    `C${cx + 16} ${top + 30} ${cx + 15} ${top + 14} ${cx + 14} ${top}`,
    'Z',
  ].join(' ')
  return <path d={d} fill={fill} fillOpacity={fillOpacity} />
}

/** 输卵管+卵巢（一侧）：宫角外延蜿蜒，末端椭圆卵巢 */
function TubeAndOvaryShape({
  side,
  hornX,
  hornY,
  fill = 'white',
  fillOpacity = 0.12,
}: {
  side: 'L' | 'R'
  hornX: number
  hornY: number
  fill?: string
  fillOpacity?: number
}) {
  const dir = side === 'L' ? -1 : 1
  const tube = `M${hornX} ${hornY} C${hornX + 14 * dir} ${hornY - 6} ${hornX + 26 * dir} ${hornY - 2} ${hornX + 36 * dir} ${hornY + 8}`
  const ovaryCx = hornX + 42 * dir
  const ovaryCy = hornY + 14
  return (
    <>
      <path d={tube} />
      <ellipse cx={ovaryCx} cy={ovaryCy} rx="12" ry="15" fill={fill} fillOpacity={fillOpacity} />
    </>
  )
}

/* ────────── 三个癌种 ────────── */

/** 宫颈癌：聚焦宫颈，病灶脉冲，脱落细胞点闪烁 */
function Cervical({ animated }: { animated: boolean }) {
  return (
    <>
      <Breathing animated={animated}>
        <UterusBodyShape cx={120} cy={54} scale={0.9} />
        <CervixCanalShape cx={120} top={82} />
        <TubeAndOvaryShape side="L" hornX={88} hornY={32} />
        <TubeAndOvaryShape side="R" hornX={152} hornY={32} />
      </Breathing>

      {/* 病灶：宫颈口脉冲 */}
      <Pulse animated={animated} delay={0.3}>
        <ellipse cx={120} cy={88} rx="15" ry="8" fill="rgb(255,130,128)" />
      </Pulse>

      {/* 脱落细胞采样点：错峰闪烁 */}
      <Dot cx={108} cy={102} animated={animated} delay={0} />
      <Dot cx={120} cy={108} animated={animated} delay={0.4} />
      <Dot cx={132} cy={102} animated={animated} delay={0.8} />
      <Dot cx={114} cy={118} animated={animated} delay={1.2} />
      <Dot cx={126} cy={118} animated={animated} delay={0.6} />
    </>
  )
}

/** 子宫内膜癌：聚焦宫体，内膜层脉冲，内膜细胞点闪烁 */
function Endometrial({ animated }: { animated: boolean }) {
  return (
    <>
      <Breathing animated={animated}>
        <UterusBodyShape cx={120} cy={58} scale={1.12} />
        <CervixCanalShape cx={120} top={86} />
        <TubeAndOvaryShape side="L" hornX={82} hornY={24} />
        <TubeAndOvaryShape side="R" hornX={158} hornY={24} />
      </Breathing>

      {/* 病灶：内膜层（缩小版子宫形态）脉冲 */}
      <Pulse animated={animated} delay={0.3}>
        <path
          d="M96 52 C93 32 105 24 120 24 C135 24 147 32 144 52 C141 64 131 68 120 68 C109 68 99 64 96 52 Z"
          fill="rgb(255,150,148)"
        />
      </Pulse>

      {/* 内膜细胞采样点 */}
      <Dot cx={106} cy={46} animated={animated} delay={0} />
      <Dot cx={120} cy={44} animated={animated} delay={0.5} />
      <Dot cx={134} cy={46} animated={animated} delay={1} />
      <Dot cx={110} cy={58} animated={animated} delay={0.3} />
      <Dot cx={130} cy={58} animated={animated} delay={0.7} />
    </>
  )
}

/** 卵巢癌：双侧卵巢脉冲，顶部血滴，ctDNA 旋转 */
function Ovarian({ animated }: { animated: boolean }) {
  return (
    <>
      <Breathing animated={animated}>
        <UterusBodyShape cx={120} cy={62} scale={0.82} />
        <CervixCanalShape cx={120} top={88} />
        <path d="M92 38 C78 34 68 40 60 48" />
        <path d="M148 38 C162 34 172 40 180 48" />
      </Breathing>

      {/* 病灶：双侧卵巢脉冲（各自时间） */}
      <Pulse animated={animated} delay={0.2}>
        <ellipse cx="54" cy="52" rx="12" ry="15" fill="rgb(255,130,128)" />
      </Pulse>
      <Pulse animated={animated} delay={1}>
        <ellipse cx="186" cy="52" rx="12" ry="15" fill="rgb(255,130,128)" />
      </Pulse>

      {/* 外周血采样：血滴 */}
      <motion.path
        d="M120 14 C116 20 112 24 112 28 A8 8 0 0 0 128 28 C128 24 124 20 120 14 Z"
        fill="rgb(194,65,64)"
        animate={animated ? { scale: [1, 1.1, 1], y: [0, -2, 0] } : undefined}
        transition={animated ? { duration: 2.5, repeat: Infinity, ease: EASE } : undefined}
        style={{ transformOrigin: '120px 22px' }}
      />

      {/* ctDNA 散点（围绕血滴，错峰闪烁） */}
      <Dot cx={102} cy={24} animated={animated} delay={0.2} />
      <Dot cx={138} cy={24} animated={animated} delay={0.6} />
      <Dot cx={96} cy={34} animated={animated} delay={1} />
      <Dot cx={144} cy={34} animated={animated} delay={1.4} />
    </>
  )
}
