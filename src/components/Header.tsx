import { useEffect, useState, useRef } from 'react'
import { Link, NavLink, useLocation } from '@/lib/router'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { products } from '@/lib/data/products'

export default function Header() {
  const { t, lang, setLang } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [productOpen, setProductOpen] = useState(false)
  const productRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 路由变化时关闭菜单
  useEffect(() => {
    // 菜单状态必须与外部路由状态同步。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
    setProductOpen(false)
  }, [pathname])

  // 点击外部关闭 Product 下拉
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setProductOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const navItems = [
    { to: '/papers', label: t('nav.research') },
    { to: '/guidelines', label: t('nav.guideline') },
    { to: '/blog', label: t('nav.blog') },
    { to: '/about', label: t('nav.about') },
  ]

  // 判断是否在某个产品详情页（用于高亮 Product 下拉）
  const onProductPage = pathname.startsWith('/products/')

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'border-b border-line/70 bg-canvas/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="shell flex h-[68px] items-center justify-between md:h-[76px]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="CISPOLY">
          <img src="/logo.png" alt="CISPOLY" className="h-7 w-auto md:h-8" />
        </Link>

        {/* 桌面导航 */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {/* Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive ? 'text-brand-600' : 'text-ink/70 hover:text-ink'
              }`
            }
          >
            {t('nav.home')}
          </NavLink>

          {/* Product 下拉 */}
          <div ref={productRef} className="relative">
            <button
              onClick={() => setProductOpen((v) => !v)}
              onMouseEnter={() => setProductOpen(true)}
              className={`flex items-center gap-0.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                onProductPage || productOpen ? 'text-brand-600' : 'text-ink/70 hover:text-ink'
              }`}
            >
              {t('nav.products')}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${productOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* 下拉面板 */}
            {productOpen && (
              <div
                onMouseLeave={() => setProductOpen(false)}
                className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-2"
              >
                <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-lift">
                  {products.map((p) => (
                    <Link
                      key={p.slug}
                      to={`/products/${p.slug}`}
                      onClick={() => setProductOpen(false)}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand-50/50"
                    >
                      {/* 色块指示器 */}
                      <span
                        className="h-8 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink transition-colors group-hover:text-brand-600">
                          {t(`nav.products.${p.slug}.name`)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-inkSoft">
                          {t(`nav.products.${p.slug}.desc`)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 其余导航项 */}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-brand-600' : 'text-ink/70 hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* CTA + 语言切换 + 移动菜单按钮 */}
        <div className="flex items-center gap-2">
          {/* 语言切换 */}
          <div className="flex items-center rounded-full border border-line bg-white/60 p-0.5 text-xs font-semibold backdrop-blur">
            <button
              onClick={() => setLang('zh')}
              className={`rounded-full px-2.5 py-1 transition-all ${
                lang === 'zh' ? 'bg-brand-500 text-white shadow-soft' : 'text-ink/50 hover:text-ink'
              }`}
            >
              中
            </button>
            <button
              onClick={() => setLang('en')}
              className={`rounded-full px-2.5 py-1 transition-all ${
                lang === 'en' ? 'bg-brand-500 text-white shadow-soft' : 'text-ink/50 hover:text-ink'
              }`}
            >
              EN
            </button>
          </div>

          {/* 联系我们（缩小版） */}
          <Link
            to="/contact"
            className="hidden items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-soft transition-all duration-300 hover:bg-brand-600 hover:shadow-lift active:scale-[0.98] md:inline-flex"
          >
            {t('common.contact')}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white/60 text-ink md:hidden"
            aria-label={t('common.menu')}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* 移动菜单 */}
      {open && (
        <div className="border-t border-line bg-canvas/95 backdrop-blur-xl md:hidden">
          <nav className="shell flex flex-col gap-1 py-4">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-base font-medium ${
                  isActive ? 'bg-brand-50 text-brand-600' : 'text-ink/80'
                }`
              }
            >
              {t('nav.home')}
            </NavLink>

            {/* Product 展开（移动端内联） */}
            <div className="px-4 py-2">
              <div className="text-sm font-semibold text-ink/80">{t('nav.products')}</div>
              <div className="mt-2 space-y-1 pl-3">
                {products.map((p) => (
                  <NavLink
                    key={p.slug}
                    to={`/products/${p.slug}`}
                    className={({ isActive }) =>
                      `block rounded-lg py-2 text-sm ${
                        isActive ? 'text-brand-600' : 'text-inkSoft'
                      }`
                    }
                  >
                    {lang === 'zh' ? p.fullName : p.fullNameEn || p.fullName}
                  </NavLink>
                ))}
              </div>
            </div>

            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-base font-medium ${
                    isActive ? 'bg-brand-50 text-brand-600' : 'text-ink/80'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {/* 语言切换（移动端） */}
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="flex items-center rounded-full border border-line bg-white p-0.5 text-xs font-semibold">
                <button
                  onClick={() => setLang('zh')}
                  className={`rounded-full px-4 py-1.5 transition-all ${
                    lang === 'zh' ? 'bg-brand-500 text-white shadow-soft' : 'text-ink/50'
                  }`}
                >
                  中
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`rounded-full px-4 py-1.5 transition-all ${
                    lang === 'en' ? 'bg-brand-500 text-white shadow-soft' : 'text-ink/50'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 w-full"
            >
              {t('common.contact')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
