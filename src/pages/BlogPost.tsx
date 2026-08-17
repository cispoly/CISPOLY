import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, ArrowLeft as ArrowIcon } from 'lucide-react'
import Markdown from '@/lib/markdown'
import { getBlog, blogs, loadBlogBody } from '@/lib/data'
import { useI18n } from '@/lib/i18n'

export default function BlogPost() {
  const { t, lang } = useI18n()
  const { slug } = useParams()
  const post = slug ? getBlog(slug) : undefined

  const [body, setBody] = useState('')
  useEffect(() => {
    if (!slug) return
    let alive = true
    // 英文模式优先加载英文正文（bodyEn），否则回退中文正文
    const loader = lang === 'en' ? import('@/data/blogs.body.en.json').then((m) => (m.default as Record<string, string>)[slug] || '').catch(() => loadBlogBody(slug)) : loadBlogBody(slug)
    Promise.resolve(loader).then((b) => alive && setBody(b))
    return () => {
      alive = false
    }
  }, [slug, lang])

  if (!post) return <Navigate to="/blog" replace />

  // 上一篇 / 下一篇（列表按日期降序：上一条为更新的，下一条为更旧的）
  const idx = blogs.findIndex((b) => b.slug === post.slug)
  const prev = idx > 0 ? blogs[idx - 1] : null
  const next = idx < blogs.length - 1 ? blogs[idx + 1] : null

  return (
    <article className="pt-20 md:pt-24">
      <div className="shell py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-inkSoft transition hover:text-brand-600"
          >
            <ArrowLeft size={15} /> {t('blogPost.back')}
          </Link>

          {/* 元信息 */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-inkSoft">
              {post.dateLabel}
            </span>
            {post.lastModified !== post.date && (
              <span className="inline-flex items-center gap-1.5 text-xs text-inkSoft/70">
                {t('blog.updatedAt')} {post.lastModifiedLabel}
              </span>
            )}
            <div className="flex flex-wrap gap-1.5">
              {(lang === 'en' && post.tagsEn ? post.tagsEn : post.tags).map((tagItem) => (
                <Link
                  key={tagItem}
                  to="/blog"
                  className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600"
                >
                  {tagItem}
                </Link>
              ))}
            </div>
          </div>

          <h1 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-ink md:text-[2rem]">
            {lang === 'en' && post.titleEn ? post.titleEn : post.title}
          </h1>

          <div className="mt-10">
            {body ? <Markdown>{body}</Markdown> : <div className="h-60 animate-pulse rounded-xl bg-line/40" />}
          </div>
        </div>

        {/* 上一篇 / 下一篇 */}
        <div className="mx-auto mt-16 grid max-w-3xl gap-4 border-t border-line pt-10 sm:grid-cols-2">
          {prev && (
            <Link to={`/blog/${prev.slug}`} className="card card-hover group flex items-center gap-3 p-4">
              <ArrowIcon size={18} className="shrink-0 text-inkSoft transition group-hover:text-brand-500" />
              <div className="min-w-0">
                <div className="text-[11px] text-inkSoft">{t('blogPost.prev')}</div>
                <div className="line-clamp-1 text-[13px] font-medium text-ink group-hover:text-brand-600">
                  {lang === 'en' && prev.titleEn ? prev.titleEn : prev.title}
                </div>
              </div>
            </Link>
          )}
          {next && (
            <Link
              to={`/blog/${next.slug}`}
              className={`card card-hover group flex items-center gap-3 p-4 ${!prev ? 'sm:col-start-2' : ''}`}
            >
              <div className="ml-auto min-w-0 text-right">
                <div className="text-[11px] text-inkSoft">{t('blogPost.next')}</div>
                <div className="line-clamp-1 text-[13px] font-medium text-ink group-hover:text-brand-600">
                  {lang === 'en' && next.titleEn ? next.titleEn : next.title}
                </div>
              </div>
              <ArrowIcon size={18} className="shrink-0 rotate-180 text-inkSoft transition group-hover:text-brand-500" />
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
