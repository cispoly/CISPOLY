import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

/**
 * 临床分流流程图：展示甲基化检测在妇科肿瘤临床路径中的决策作用。
 * 这是一个通用的、克制的 SVG/CSS 流程图组件。
 */
interface FlowNode {
  label: string
  sub?: string
  tone?: 'start' | 'test' | 'pos' | 'neg' | 'end'
}

const NODE_STYLE: Record<string, string> = {
  start: 'bg-canvas border-line text-ink',
  test: 'bg-brand-500 border-brand-500 text-white',
  pos: 'bg-brand-50 border-brand-200 text-brand-700',
  neg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  end: 'bg-ink border-ink text-white',
}

function Node({ node }: { node: FlowNode }) {
  return (
    <div
      className={`rounded-xl border-2 px-5 py-3 text-center shadow-soft ${NODE_STYLE[node.tone || 'start']}`}
    >
      <div className="text-sm font-semibold leading-tight">{node.label}</div>
      {node.sub && <div className="mt-0.5 text-[11px] opacity-75">{node.sub}</div>}
    </div>
  )
}

function Arrow() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      whileInView={{ opacity: 1, scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="origin-top text-brand-300"
    >
      <ArrowDown size={20} className="mx-auto" />
    </motion.div>
  )
}

export default function Flowchart({ cancer }: { cancer: 'cervical' | 'endometrial' | 'ovarian' }) {
  const { t } = useI18n()

  // 不同癌种的临床路径
  const flows: Record<string, FlowNode[][]> = {
    cervical: [
      [{ label: t('flow.cervical.start.label'), sub: t('flow.cervical.start.sub'), tone: 'start' }],
      [{ label: t('flow.cervical.test.label'), sub: t('flow.cervical.test.sub'), tone: 'test' }],
      [
        { label: t('flow.cervical.pos.label'), sub: t('flow.cervical.pos.sub'), tone: 'pos' },
        { label: t('flow.cervical.neg.label'), sub: t('flow.cervical.neg.sub'), tone: 'neg' },
      ],
      [
        { label: t('flow.cervical.end1.label'), tone: 'end' },
        { label: t('flow.cervical.end2.label'), sub: t('flow.cervical.end2.sub'), tone: 'end' },
      ],
    ],
    endometrial: [
      [{ label: t('flow.endometrial.start.label'), tone: 'start' }],
      [{ label: t('flow.endometrial.test.label'), sub: t('flow.endometrial.test.sub'), tone: 'test' }],
      [
        { label: t('flow.endometrial.pos.label'), sub: t('flow.endometrial.pos.sub'), tone: 'pos' },
        { label: t('flow.endometrial.neg.label'), sub: t('flow.endometrial.neg.sub'), tone: 'neg' },
      ],
      [
        { label: t('flow.endometrial.end1.label'), tone: 'end' },
        { label: t('flow.endometrial.end2.label'), tone: 'end' },
      ],
    ],
    ovarian: [
      [{ label: t('flow.ovarian.start.label'), sub: t('flow.ovarian.start.sub'), tone: 'start' }],
      [{ label: t('flow.ovarian.test.label'), sub: t('flow.ovarian.test.sub'), tone: 'test' }],
      [
        { label: t('flow.ovarian.pos.label'), sub: t('flow.ovarian.pos.sub'), tone: 'pos' },
        { label: t('flow.ovarian.neg.label'), sub: t('flow.ovarian.neg.sub'), tone: 'neg' },
      ],
      [
        { label: t('flow.ovarian.end1.label'), tone: 'end' },
        { label: t('flow.ovarian.end2.label'), tone: 'end' },
      ],
    ],
  }

  const layers = flows[cancer] || flows.cervical

  return (
    <div className="rounded-2xl border border-line bg-white p-6 md:p-10">
      <div className="space-y-5">
        {layers.map((layer, li) => (
          <div key={li}>
            {li > 0 && (
              <div className="my-3">
                <Arrow />
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: li * 0.15 }}
              className={`grid gap-4 ${layer.length > 1 ? 'sm:grid-cols-2' : 'max-w-xs mx-auto'}`}
            >
              {layer.map((n, ni) => (
                <Node key={ni} node={n} />
              ))}
            </motion.div>
          </div>
        ))}
      </div>
      <p className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-inkSoft">
        {t('flow.note')}
      </p>
    </div>
  )
}
