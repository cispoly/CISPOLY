import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  Navigate as RouterNavigate,
  type LinkProps,
  type NavLinkProps,
  type NavigateProps,
} from 'react-router'
import { useI18n } from '@/lib/i18n'

export { useLocation, useNavigate, useParams, useLoaderData } from 'react-router'

export function localizePath(to: LinkProps['to'], lang: 'zh' | 'en'): LinkProps['to'] {
  if (lang !== 'en' || typeof to !== 'string' || !to.startsWith('/') || to.startsWith('/en')) {
    return to
  }
  return to === '/' ? '/en' : `/en${to}`
}

export function Link({ to, ...props }: LinkProps) {
  const { lang } = useI18n()
  return <RouterLink to={localizePath(to, lang)} {...props} />
}

export function NavLink({ to, ...props }: NavLinkProps) {
  const { lang } = useI18n()
  return <RouterNavLink to={localizePath(to, lang)} {...props} />
}

export function Navigate({ to, ...props }: NavigateProps) {
  const { lang } = useI18n()
  return <RouterNavigate to={localizePath(to, lang)} {...props} />
}
