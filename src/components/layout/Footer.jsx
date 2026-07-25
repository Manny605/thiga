import { Link } from 'react-router-dom'
import { Languages } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { useAuth } from '../../auth/AuthProvider'
import { dashPathFor } from '../../auth/roles'
import { LINKS } from './Header'

export default function Footer() {
  const { t, toggle, other } = useI18n()
  const { isAuthenticated, profile } = useAuth()
  const year = new Date().getFullYear()
  const dashPath = isAuthenticated ? dashPathFor(profile?.role) : null

  return (
    <footer className="bg-vert-900 text-sand-200">
      <div className="shell flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="font-display text-[17px] tracking-mark text-sand-50">THIGA</span>
          <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-sand-200/60">
            {t('footer.tagline')}
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-sand-200/75">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="transition-colors hover:text-sand-50">
              {t(l.key)}
            </Link>
          ))}
          {/* Connexion et inscription sont fermées aux connectés : on pointe
              vers leur portail plutôt que vers une redirection. */}
          {dashPath ? (
            <Link to={dashPath} className="transition-colors hover:text-sand-50">{t('dash.overview')}</Link>
          ) : (
            <>
              <Link to="/connexion" className="transition-colors hover:text-sand-50">{t('nav.login')}</Link>
              <Link to="/inscription" className="transition-colors hover:text-sand-50">{t('nav.register')}</Link>
            </>
          )}
        </nav>

        <button
          onClick={toggle}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-sand-200/25 px-3 py-2 text-[12.5px] text-sand-100 transition-colors hover:border-sand-200/60 hover:bg-white/5 md:self-auto"
        >
          <Languages className="h-3.5 w-3.5" />
          {other}
        </button>
      </div>

      <div className="border-t border-sand-200/10">
        <div className="shell flex flex-col gap-2 py-4 text-[12px] text-sand-200/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} THIGA — {t('footer.rights')}</p>
          <div className="flex gap-5">
            <Link to="/" className="transition-colors hover:text-sand-100">{t('footer.legal')}</Link>
            <Link to="/" className="transition-colors hover:text-sand-100">{t('footer.privacy')}</Link>
            <Link to="/" className="transition-colors hover:text-sand-100">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
