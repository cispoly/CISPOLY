import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Calendar } from 'lucide-react'
import SectionTitle from '@/components/SectionTitle'
import Reveal from '@/components/Reveal'
import PageHero from '@/components/PageHero'
import { blogs, allTags } from '@/lib/data'
import { PAGE_HERO_IMAGES } from '@/lib/images'
import { useI18n } from '@/lib/i18n'

export default function Blog() {
  const { t, lang } = useI18n()
  const [tag, setTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // 根据语言选择标签集和标题字段
  const isEn = lang === 'en'
  const blogTags = (b: typeof blogs[0]) => (isEn && b.tagsEn ? b.tagsEn : b.tags)
  const blogTitle = (b: typeof blogs[0]) => (isEn && b.titleEn ? b.titleEn : b.title)
  const activeTags = isEn
    ? [...new Set(blogs.flatMap((b) => b.tagsEn || b.tags))].sort()
    : allTags

  const filtered = useMemo(() => {
    return blogs.filter((b) => {
      const tags = blogTags(b)
      const matchTag = !tag || tags.includes(tag)
      const title = blogTitle(b)
      const matchQuery = !query || title.toLowerCase().includes(query.toLowerCase())
      return matchTag && matchQuery
    })
  }, [tag, query, lang])

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
              onClick={() => setTag(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                !tag ? 'bg-brand-500 text-white' : 'border border-line bg-white text-ink/70 hover:text-brand-600'
              }`}
            >
              {t('common.all')} {blogs.length}
            </button>
            {activeTags.map((tagItem) => {
              const count = blogs.filter((b) => blogTags(b).includes(tagItem)).length
              return (
                <button
                  key={tagItem}
                  onClick={() => setTag(tagItem)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    tag === tagItem ? 'bg-brand-500 text-white' : 'border border-line bg-white text-ink/70 hover:text-brand-600'
                  }`}
                >
                  {tagItem} {count}
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
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {filtered.map((b, i) => (
                <Reveal key={b.slug} delay={(i % 3) * 0.06}>
                  <Link
                    to={`/blog/${b.slug}`}
                    className="card card-hover group flex items-stretch overflow-hidden"
                  >
                    {/* 左侧封面图：宽度固定、高度按封面比例(≈2.35:1)自适应，object-cover 完整展示不裁切 */}
                    <div className="my-3 ml-3 aspect-[2.35/1] w-28 shrink-0 self-center overflow-hidden rounded-lg bg-[#F3EDEA] sm:my-4 sm:ml-4 sm:w-36 md:w-44">
                      {b.cover ? (
                        <img
                          src={b.cover}
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
                      <h3 className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink transition group-hover:text-brand-600 sm:text-[15px]">
                        {lang === 'en' && b.titleEn ? b.titleEn : b.title}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(lang === 'en' && b.tagsEn ? b.tagsEn : b.tags).slice(0, 3).map((tagItem, ti) => (
                          <span key={ti} className="rounded bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                            {tagItem}
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
