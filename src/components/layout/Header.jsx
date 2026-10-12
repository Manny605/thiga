import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGrid, LogOut, Menu, X, Languages } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { useAuth } from '../../auth/AuthProvider'
import { dashPathFor } from '../../auth/roles'
import Button from '../ui/Button'
import logoMark from '../../../assets/logo-removebg.png'

export function Wordmark({ className = '', imgClass = 'h-16 w-auto' }) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`} aria-label="THIGA">
      <img src={logoMark} alt="THIGA" className={imgClass} />
    </Link>
  )
}

export const LINKS = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/offres', key: 'nav.jobs' },
  { to: '/travailleurs', key: 'nav.workers' },
  { to: '/a-propos', key: 'nav.about' },
]

export default function Header() {
  const { t, toggle, other } = useI18n()
  const { profile, isAuthenticated, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const dashPath = dashPathFor(profile?.role) || '/'

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const linkCls = ({ isActive }) =>
    `text-[15px] transition-colors ${
      isActive ? 'font-medium text-vert-700' : 'text-ink-600 hover:text-ink'
    }`

  return (
    <header className="sticky top-0 z-50">
      {/* Le flou vit dans ce wrapper, pas sur <header> : un backdrop-filter sur
          l'élément fixed-positioned (le panneau mobile) créerait son propre
          "containing block" et casserait son positionnement plein écran. */}
      <div className="border-b border-sand-200 bg-sand-50/80 backdrop-blur-xl">
        <div className="shell flex h-20 items-center justify-between gap-6">
          <Wordmark />

          <nav className="hidden items-center gap-9 xl:flex">
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>
                {t(l.key)}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <button
              onClick={toggle}
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[14px] font-medium text-ink-600 transition-colors hover:bg-sand-100 hover:text-ink"
              aria-label={other}
            >
              <Languages className="h-4 w-4" />
              {other}
            </button>
            <span className="h-5 w-px bg-sand-300" aria-hidden="true" />
            {isAuthenticated ? (
              <>
                <Button to={dashPath} variant="ghost" size="sm">
                  <LayoutGrid className="h-4 w-4" />
                  {profile?.full_name || t('dash.overview')}
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="h-4 w-4" />
                  {t('dash.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button to="/connexion" variant="ghost" size="sm">{t('nav.login')}</Button>
                <Button to="/inscription" size="sm">{t('nav.register')}</Button>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sand-300 bg-white shadow-sm xl:hidden"
            aria-label={open ? t('nav.close') : t('nav.menu')}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Panneau mobile */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-20 z-40 animate-fade overflow-y-auto border-t border-sand-300 bg-sand-50 xl:hidden">
          <nav className="shell stagger flex flex-col py-4">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className="border-b border-sand-200/70 py-4 font-display text-2xl text-ink"
              >
                {t(l.key)}
              </NavLink>
            ))}
          </nav>
          <div className="shell flex flex-col gap-3 pb-10 pt-4">
            {isAuthenticated ? (
              <>
                <Button to={dashPath} size="lg">
                  <LayoutGrid className="h-4 w-4" />
                  {profile?.full_name || t('dash.overview')}
                </Button>
                <Button onClick={handleLogout} variant="outline" size="lg">
                  <LogOut className="h-4 w-4" />
                  {t('dash.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button to="/inscription" size="lg">{t('nav.register')}</Button>
                <Button to="/connexion" variant="outline" size="lg">{t('nav.login')}</Button>
              </>
            )}
            <button
              onClick={toggle}
              className="mt-2 inline-flex items-center justify-center gap-2 py-2 text-sm text-ink-600"
            >
              <Languages className="h-4 w-4" />
              {other}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
