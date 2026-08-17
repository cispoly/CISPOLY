import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import Home from '@/pages/Home'
import { I18nProvider } from '@/lib/i18n'

// 路由级懒加载：首屏只需 Home，详情页（含 markdown 库与大正文数据）按需加载
const ProductDetail = lazy(() => import('@/pages/ProductDetail'))
const Papers = lazy(() => import('@/pages/Papers'))
const PaperDetail = lazy(() => import('@/pages/PaperDetail'))
const Guidelines = lazy(() => import('@/pages/Guidelines'))
const GuidelineDetail = lazy(() => import('@/pages/GuidelineDetail'))
const Blog = lazy(() => import('@/pages/Blog'))
const BlogPost = lazy(() => import('@/pages/BlogPost'))
const About = lazy(() => import('@/pages/About'))
const Contact = lazy(() => import('@/pages/Contact'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center pt-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand-500" />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <div className="flex min-h-screen flex-col">
        <ScrollToTop />
        <Header />
        <main className="flex-1">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              {/* /products 重定向到首页（产品矩阵已整合到首页） */}
              <Route path="/products" element={<Navigate to="/" replace />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/papers" element={<Papers />} />
              <Route path="/papers/:cancer/:id" element={<PaperDetail />} />
              <Route path="/guidelines" element={<Guidelines />} />
              <Route path="/guidelines/:cancer/:id" element={<GuidelineDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </I18nProvider>
  )
}
