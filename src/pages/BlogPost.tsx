import type { LoaderFunctionArgs, MetaFunction, ShouldRevalidateFunctionArgs } from 'react-router'
import { Link, useLoaderData } from '@/lib/router'
import { ArrowLeft, ArrowLeft as ArrowIcon } from 'lucide-react'
import Markdown from '@/lib/markdown'
import { getBlog, blogs } from '@/lib/data/blogs'
import { getBlogBody } from '@/lib/data/blogBodies'
import { useI18n } from '@/lib/i18n'
import { pageMeta } from '@/lib/seo'

export function loader({ params, request }: LoaderFunctionArgs) {
  const slug = params.slug || ''
  const post = getBlog(slug)
  if (!post) throw new Response('Blog post not found', { status: 404 })

  const lang = new URL(request.url).pathname.startsWith('/en/') ? 'en' : 'zh'
  const index = blogs.findIndex((item) => item.slug === slug)
  return {
    post,
    body: getBlogBody(slug, lang),
    prev: index > 0 ? blogs[index - 1] : null,
    next: index < blogs.length - 1 ? blogs[index + 1] : null,
    lang,
  }
}

// The optional `en?` route segment is not a route param, so explicitly reload
// loader data when switching between the Chinese and English URL variants.
export function shouldRevalidate({ currentUrl, nextUrl }: ShouldRevalidateFunctionArgs) {
  return currentUrl.pathname !== nextUrl.pathname
}

export const meta: MetaFunction<typeof loader> = ({ loaderData, location }) => {
  if (!loaderData) return [{ title: 'CISPOLY' }]
  const { post, lang } = loaderData
  const title = lang === 'en' && post.titleEn ? post.titleEn : post.title
  const description = lang === 'en' && post.excerptEn ? post.excerptEn : post.excerpt
  return pageMeta(location.pathname, {
    titleZh: `${post.title} | CISPOLY`,
    titleEn: `${post.titleEn || post.title} | CISPOLY`,
    descriptionZh: post.excerpt,
    descriptionEn: post.excerptEn || post.excerpt,
    image: post.cover,
    type: 'article',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      datePublished: post.date,
      dateModified: post.lastModified,
      publisher: { '@type': 'Organization', name: 'CISPOLY' },
    },
  })
}

export default function BlogPost() {
  const { t, lang } = useI18n()
  const { post, prev, next } = useLoaderData<typeof loader>()
  // Keep the rendered article body in sync with the language context even
  // before a client-side loader revalidation completes.
  const body = getBlogBody(post.slug, lang)

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
            <Markdown>{body}</Markdown>
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
