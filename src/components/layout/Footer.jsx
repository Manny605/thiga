import { Link } from 'react-router-dom'
import { Languages } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { useAuth } from '../../auth/AuthProvider'
import { dashPathFor } from '../../auth/roles'
import { LINKS } from './Header'
import logoMark from '../../../assets/logo-removebg.png'

export default function Footer() {
  const { t, toggle, other } = useI18n()
  const { isAuthenticated, profile } = useAuth()
  const year = new Date().getFullYear()
  const dashPath = isAuthenticated ? dashPathFor(profile?.role) : null

  const link = 'text-[14.5px] text-sand-200/75 transition-colors hover:text-sand-50'
  const heading = 'mb-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-ocre-300'

  return (
    <footer className="relative overflow-hidden bg-vert-900 text-sand-200">
      <div className="motif-light pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden="true" />

      <div className="shell relative grid gap-10 py-14 md:grid-cols-12 md:py-16">
        <div className="md:col-span-5">
          <Link to="/" className="inline-flex items-center gap-3" aria-label="THIGA">
            {/* Pastille claire : le logo est dessiné pour un fond clair. */}
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sand-50 p-1.5">
              <img src={logoMark} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="font-display text-[18px] font-medium tracking-mark text-sand-50">THIGA</span>
          </Link>
          <p className="mt-5 max-w-sm text-[14.5px] leading-relaxed text-sand-200/65">{t('footer.tagline')}</p>
          <button
            onClick={toggle}
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-sand-200/25 px-3.5 py-2 text-[13.5px] text-sand-100 transition-colors hover:border-sand-200/60 hover:bg-white/5"
          >
            <Languages className="h-4 w-4" />
            {other}
          </button>
        </div>

        <nav className="md:col-span-3 md:col-start-7" aria-label={t('footer.explore')}>
          <p className={heading}>{t('footer.explore')}</p>
          <ul className="space-y-3">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className={link}>{t(l.key)}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="md:col-span-3" aria-label={t('footer.account')}>
          <p className={heading}>{t('footer.account')}</p>
          <ul className="space-y-3">
            {/* Connexion et inscription sont fermées aux connectés : on pointe
                vers leur portail plutôt que vers une redirection. */}
            {dashPath ? (
              <li><Link to={dashPath} className={link}>{t('dash.overview')}</Link></li>
            ) : (
              <>
                <li><Link to="/connexion" className={link}>{t('nav.login')}</Link></li>
                <li><Link to="/inscription" className={link}>{t('nav.register')}</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>

      <div className="relative border-t border-sand-200/10">
        <div className="shell flex flex-col gap-2 py-5 text-[13px] text-sand-200/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} THIGA. {t('footer.rights')}</p>
          <div className="flex gap-5">
            <Link to="/mentions-legales" className="transition-colors hover:text-sand-100">{t('footer.legal')}</Link>
            <Link to="/confidentialite" className="transition-colors hover:text-sand-100">{t('footer.privacy')}</Link>
            <Link to="/conditions" className="transition-colors hover:text-sand-100">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
