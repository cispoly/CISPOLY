import { motion } from 'framer-motion'

interface MetricBarProps {
  label: string
  value: string // 如 "89.60%"
  sub?: string
  color?: string
  delay?: number
}

/** 百分比数据可视化进度条 */
export default function MetricBar({ label, value, sub, color = 'rgb(215,75,74)', delay = 0 }: MetricBarProps) {
  const pct = parseFloat(value.replace(/[^0-9.]/g, '')) || 0

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="font-mono text-2xl font-bold tracking-tight text-ink">{value}</span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(pct, 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {sub && <div className="mt-1.5 text-[11px] text-inkSoft">{sub}</div>}
    </div>
  )
}
