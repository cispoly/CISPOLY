import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FlaskRound,
  FileText,
  BookOpenCheck,
  Newspaper,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { company } from '@/lib/data'
import { pick } from '@/lib/i18n'

interface Slide {
  image: string
  icon: React.ReactNode
  eyebrow: string
  title: React.ReactNode
  subtitle: string
  cta: { label: string; to: string }
}

const SLIDE_INTERVAL = 3000

export default function Hero() {
  const { t, lang } = useI18n()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setIndex((i) => (i + 1) % 5), [])
  const prev = useCallback(() => setIndex((i) => (i - 1 + 5) % 5), [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [paused, next])

  // 预加载所有轮播图，避免切换时白屏
  useEffect(() => {
    slides.forEach((s) => {
      const img = new Image()
      img.src = s.image
    })
    // slides 在组件内静态定义，只需执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const slides: Slide[] = [
    {
      image: '/hero/anita-austvika-XQbCwyHjp6s.jpg',
      icon: <Sparkles size={13} />,
      eyebrow: t('hero.slide1.eyebrow'),
      title: (
        <>
          {t('hero.slide1.titlePrefix')}
          <br />
          <span className="text-brand-500">{t('hero.slide1.titleHighlight')}</span>
        </>
      ),
      subtitle:
        lang === 'zh'
          ? `${company.shortName}专注宫颈癌、子宫内膜癌、卵巢癌的 DNA 甲基化早筛早诊，以无创技术填补临床空白，造福中国乃至全球的女性。`
          : 'CISPOLY focuses on DNA methylation-based early screening and diagnosis of cervical, endometrial, and ovarian cancers, filling clinical gaps with non-invasive technology to benefit women in China and worldwide.',
      cta: { label: t('hero.slide1.cta'), to: '/about' },
    },
    {
      image: '/hero/becca-tapert-u5e1kqW6E3M.jpg',
      icon: <FlaskRound size={13} />,
      eyebrow: t('hero.slide2.eyebrow'),
      title: (
        <>
          {t('hero.slide2.titlePrefix')}
          <br />
          <span className="text-brand-500">
            {lang === 'zh' ? (
              t('hero.slide2.titleHighlightPrefix') + t('hero.slide2.titleHighlightSuffix')
            ) : (
              t('hero.slide2.titleHighlightPrefix') + ' ' + t('hero.slide2.titleHighlightSuffix')
            )}
          </span>
        </>
      ),
      subtitle: t('hero.slide2.subtitle'),
      cta: { label: t('hero.slide2.cta'), to: '/products/ciscer' },
    },
    {
      image: '/hero/daiga-ellaby-sl8LHdVH06U.jpg',
      icon: <FileText size={13} />,
      eyebrow: t('hero.slide3.eyebrow'),
      title: (
        <>
          {t('hero.slide3.titlePrefix')}
          <br />
          <span className="text-brand-500">{t('hero.slide3.titleHighlight')}</span>{' '}
          {t('hero.slide3.titleSuffix')}
        </>
      ),
      subtitle: t('hero.slide3.subtitle'),
      cta: { label: t('hero.slide3.cta'), to: '/papers' },
    },
    {
      image: '/hero/fausto-garcia-menendez-zXNywOKuCoI.jpg',
      icon: <BookOpenCheck size={13} />,
      eyebrow: t('hero.slide4.eyebrow'),
      title: (
        <>
          {t('hero.slide4.titlePrefix')}
          <br />
          <span className="text-brand-500">{t('hero.slide4.titleHighlight')}</span>{' '}
          {t('hero.slide4.titleSuffix')}
        </>
      ),
      subtitle: t('hero.slide4.subtitle'),
      cta: { label: t('hero.slide4.cta'), to: '/guidelines' },
    },
    {
      image: '/hero/simon-maage-tXiMrX3Gc-g.jpg',
      icon: <Newspaper size={13} />,
      eyebrow: t('hero.slide5.eyebrow'),
      title: (
        <>
          {t('hero.slide5.titlePrefix')}
          <br />
          <span className="text-brand-500">{t('hero.slide5.titleHighlight')}</span>{' '}
          {t('hero.slide5.titleSuffix')}
        </>
      ),
      subtitle: t('hero.slide5.subtitle'),
      cta: { label: t('hero.slide5.cta'), to: '/blog' },
    },
  ]

  const slide = slides[index]

  return (
    <section
      className="relative flex min-h-[600px] items-center overflow-hidden md:min-h-[100svh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ===== 图片轮播层 ===== */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 1.4, ease: 'easeInOut' }, scale: { duration: 7, ease: 'easeOut' } }}
          >
            <img
              src={slide.image}
              alt=""
              className="h-full w-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ===== 毛玻璃遮罩层（更强毛玻璃质感：模糊 + 饱和 + 明暗渐变） ===== */}
      <div className="absolute inset-0 bg-canvas/10 backdrop-blur-md backdrop-saturate-150" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-canvas/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-canvas/60 via-canvas/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas to-transparent" />

      {/* ===== 轮播进度条（随自动播放倒计时，悬停暂停时冻结） ===== */}
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-white/10">
        {!paused && (
          <motion.div
            key={index}
            className="h-full bg-gradient-to-r from-brand-300 to-brand-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: SLIDE_INTERVAL / 1000, ease: 'linear' }}
          />
        )}
      </div>

      {/* ===== 内容层（自适应高度，避免小屏与底部指示器重叠） ===== */}
      <div className="shell relative z-10 flex w-full flex-col justify-center pb-20 pt-24">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div key={index} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/60 px-4 py-1.5 text-xs font-semibold text-brand-600 backdrop-blur">
                {slide.icon} {slide.eyebrow}
              </span>

              <h1 className="mt-6 text-[clamp(2rem,8.5vw,2.6rem)] font-bold leading-[1.12] tracking-tight text-ink md:mt-7 md:text-7xl">
                {slide.title}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/75 md:mt-6 md:text-lg">
                {slide.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10">
                <Link to={slide.cta.to} className="btn-primary">
                  {slide.cta.label} <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ===== 轮播控制 ===== */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-white/30 text-ink backdrop-blur-md transition hover:bg-white/50 md:grid"
        aria-label="Previous"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-white/30 text-ink backdrop-blur-md transition hover:bg-white/50 md:grid"
        aria-label="Next"
      >
        <ChevronRight size={20} />
      </button>

      {/* ===== 主题标签指示器（小屏防横向溢出） ===== */}
      <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line/60 bg-white/40 px-1.5 py-1.5 backdrop-blur-md">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={s.eyebrow}
              className={`grid h-8 min-w-8 shrink-0 place-items-center rounded-full text-xs font-medium transition-all duration-300 sm:flex sm:items-center sm:gap-1.5 sm:px-3 ${
                i === index ? 'bg-brand-500 text-white shadow-soft' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {/* 小屏：圆点指示器；大屏：图标 + 文字标签 */}
              <span className="h-2 w-2 rounded-full bg-current opacity-90 sm:hidden" />
              <span className="hidden sm:inline">{s.icon}</span>
              <span className="hidden sm:inline">{s.eyebrow}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
