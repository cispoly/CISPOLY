import { useState, useMemo, useCallback } from 'react'
import { Link } from '@/lib/router'
import { Calendar } from 'lucide-react'
import Reveal from '@/components/Reveal'
import PageHero from '@/components/PageHero'
import { blogs } from '@/lib/data/blogs'
import { PAGE_HERO_IMAGES } from '@/lib/images'
import { useI18n } from '@/lib/i18n'
import { BLOG_CATEGORY_ORDER, blogCategories, blogCategoryLabel, type BlogCategory } from '@/lib/blogTaxonomy'
import type { MetaFunction } from 'react-router'
import { pageMeta } from '@/lib/seo'

export const meta: MetaFunction = ({ location }) => pageMeta(location.pathname, {
  titleZh: '企业动态与健康科普 | CISPOLY 聚禾生物',
  titleEn: 'News and Health Insights | CISPOLY',
  descriptionZh: '了解聚禾生物最新动态、学术进展、会议资讯与女性健康科普。',
  descriptionEn: 'Read CISPOLY news, academic updates, conference insights, and women’s health education.',
})

export default function Blog() {
  const { t, lang } = useI18n()
  const [category, setCategory] = useState<BlogCategory | null>(null)
  const [query, setQuery] = useState('')

  const isEn = lang === 'en'
  const blogTitle = useCallback((b: typeof blogs[0]) => (isEn && b.titleEn ? b.titleEn : b.title), [isEn])
  const blogCover = useCallback((b: typeof blogs[0]) => (isEn && b.coverEn ? b.coverEn : b.cover), [isEn])

  const filtered = useMemo(() => {
    return blogs.filter((b) => {
      const matchCategory = !category || blogCategories(b).includes(category)
      const title = blogTitle(b)
      const matchQuery = !query || title.toLowerCase().includes(query.toLowerCase())
      return matchCategory && matchQuery
    })
  }, [category, query, blogTitle])

  return (
    <div>
      <PageHero
        image={PAGE_HERO_IMAGES.blog}
        eyebrow={t('blog.hero.eyebrow')}
        title={t('blog.hero.title')}
        subtitle={t('blog.hero.subtitle')}
      />

      {/* 搜索 + 标签 */}
      <section className="pb-6">
        <div className="shell space-y-5">
          <div className="mx-auto max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('blog.searchPlaceholder')}
              className="w-full rounded-full border border-line bg-white px-5 py-2.5 text-sm text-ink placeholder:text-inkSoft/50 transition focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                !category ? 'bg-brand-500 text-white' : 'border border-line bg-white text-ink/70 hover:text-brand-600'
              }`}
            >
              {t('common.all')} {blogs.length}
            </button>
            {BLOG_CATEGORY_ORDER.map((categoryItem) => {
              const count = blogs.filter((b) => blogCategories(b).includes(categoryItem)).length
              return (
                <button
                  key={categoryItem}
                  onClick={() => setCategory(categoryItem)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    category === categoryItem ? 'bg-brand-500 text-white' : 'border border-line bg-white text-ink/70 hover:text-brand-600'
                  }`}
                >
                  {blogCategoryLabel(categoryItem, lang)} {count}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* 文章列表：纵向列表，左图右文 */}
      <section className="py-10 md:py-14">
        <div className="shell">
          {filtered.length === 0 ? (
            <p className="py-20 text-center text-inkSoft">{t('blog.notFound')}</p>
          ) : (
            <div className="mx-auto flex max-w-[62.4rem] flex-col gap-4">
              {filtered.map((b, i) => (
                <Reveal key={b.slug} delay={(i % 3) * 0.06}>
                  <Link
                    to={`/blog/${b.slug}`}
                    className="card card-hover group flex items-stretch overflow-hidden"
                  >
                    {/* 左侧封面图：宽度固定、高度按封面比例(≈2.35:1)自适应，object-cover 完整展示不裁切 */}
                    <div className="my-3 ml-3 aspect-[2.35/1] w-28 shrink-0 self-center overflow-hidden rounded-lg bg-[#F3EDEA] sm:my-4 sm:ml-4 sm:w-36 md:w-44">
                      {blogCover(b) ? (
                        <img
                          src={blogCover(b) as string}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
                    {/* 右侧信息 */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 sm:p-5">
                      <h3 className="whitespace-normal break-words text-[14px] font-semibold leading-snug text-ink transition group-hover:text-brand-600 sm:text-[15px]">
                        {lang === 'en' && b.titleEn ? b.titleEn : b.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {blogCategories(b).map((categoryItem) => (
                          <span key={categoryItem} className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                            {blogCategoryLabel(categoryItem, lang)}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-inkSoft">
                        <Calendar size={11} /> {t('blog.updatedAt')} {b.lastModifiedLabel}
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
