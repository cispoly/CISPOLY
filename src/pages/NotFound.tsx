import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export default function NotFound() {
  const { t } = useI18n()

  return (
    <div className="grid min-h-[70vh] place-items-center pt-20">
      <div className="shell text-center">
        <div className="font-mono text-7xl font-bold tracking-tight text-brand-200 md:text-9xl">404</div>
        <h1 className="mt-4 text-2xl font-bold text-ink">{t('notfound.title')}</h1>
        <p className="mt-3 text-inkSoft">{t('notfound.desc')}</p>
        <Link to="/" className="btn-primary mt-8">
          <Home size={16} /> {t('notfound.back')}
        </Link>
      </div>
    </div>
  )
}
