import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { Components } from 'react-markdown'
import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'

/** 提取 ReactNode 中的纯文本（用于识别特殊标题段落） */
function extractText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as { props?: { children?: ReactNode } }).props?.children)
  }
  return ''
}

/** 是否为「关于聚禾生物 / About CISPOLY」标题段落 */
function isAboutTitle(text: string): boolean {
  const t = text.trim()
  return t === '关于聚禾生物' || /^about\s*cispoly$/i.test(t)
}

const components: Components = {
  // 图片：懒加载 + 错误兜底
  img: ({ src, alt, node: _node, ...props }) => (
    <img
      src={src as string}
      alt={alt || ''}
      loading="lazy"
      className="my-6 rounded-xl shadow-soft"
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
      {...props}
    />
  ),
  a: ({ children, href, node: _node, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  p: ({ children, node: _node, ...props }) => {
    const text = extractText(children).trim()
    // 「关于聚禾生物 / About CISPOLY」→ 品牌横幅
    if (isAboutTitle(text)) {
      return <AboutCispolyBanner text={text} />
    }
    return <p {...props}>{children}</p>
  },
}

/** 博客「关于聚禾生物 / About CISPOLY」品牌横幅 */
function AboutCispolyBanner({ text }: { text: string }) {
  const { lang } = useI18n()
  const tag = lang === 'zh' ? 'CISPOLY · 聚禾生物' : 'CISPOLY · Beijing Origin-Poly'
  return (
    <div className="about-cispoly-banner">
      <div>
        <div className="about-cispoly-title">{text}</div>
        <div className="about-cispoly-tag">{tag}</div>
      </div>
      <div className="about-cispoly-brand">
        <img src="/logo.png" alt="CISPOLY" />
      </div>
    </div>
  )
}

interface MDProps {
  children: string
  className?: string
}

export default function Markdown({ children, className }: MDProps) {
  return (
    <div className={`prose-cispoly ${className || ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
