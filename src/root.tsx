import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
  useRouteError,
} from 'react-router'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import { I18nProvider } from '@/lib/i18n'
import stylesheet from '@/styles/index.css?url'

export const links = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const lang = pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'zh'

  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return (
    <I18nProvider>
      <div className="flex min-h-screen flex-col">
        <ScrollToTop />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </I18nProvider>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const status = isRouteErrorResponse(error) ? error.status : 500
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Unexpected error'

  return (
    <I18nProvider>
      <main className="grid min-h-screen place-items-center bg-canvas px-6 text-center">
        <div>
          <p className="text-sm font-semibold text-brand-600">{status}</p>
          <h1 className="mt-3 text-3xl font-bold text-ink">页面暂时无法显示</h1>
          <p className="mt-3 max-w-xl text-sm text-inkSoft">{message}</p>
          <a className="btn-primary mt-8" href="/">返回首页</a>
        </div>
      </main>
    </I18nProvider>
  )
}
