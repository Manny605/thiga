import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Languages, X } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { useAuth } from '../../auth/AuthProvider'
import Avatar from '../ui/Avatar'
import NotificationsBell from './NotificationsBell'
import logoMark from '../../../assets/logo-removebg.png'

/**
 * Coquille partagée par les trois tableaux de bord — style SaaS moderne :
 * sidebar claire vitrée, pastilles de navigation arrondies, ombres douces.
 * `variant="admin"` bascule l'accent en ocre pour marquer l'espace séparé,
 * tout en gardant la même mise en page claire ("même look partout").
 */
export default function DashShell({
  variant = 'user', space, user, avatar = null, nav, title, action, notifications = [], children,
}) {
  const { t, toggle, other } = useI18n()
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const admin = variant === 'admin'

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Accent de l'espace : vert (utilisateurs) ou ocre (admin).
  const activeCls = admin
    ? 'bg-ocre-100 text-ocre-700 shadow-sm ring-1 ring-ocre-300/50'
    : 'bg-vert-50 text-vert-700 shadow-sm ring-1 ring-vert-100'
  const dotCls = admin ? 'bg-ocre-500' : 'bg-vert-600'
  const countCls = admin ? 'bg-ocre-500 text-white' : 'bg-vert-600 text-white'

  const itemCls = ({ isActive }) =>
    [
      'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14.5px] font-medium transition-all duration-200',
      isActive
        ? activeCls
        : 'text-ink-600 hover:bg-white hover:text-ink hover:shadow-sm',
    ].join(' ')

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        {/* `alt` vide : le mot-repère juste à côté porte déjà le nom, inutile
            de le faire annoncer deux fois par un lecteur d'écran. */}
        <img src={logoMark} alt="" className="h-10 w-10 shrink-0 object-contain" />
        <span className="font-display text-[16px] tracking-mark text-ink">THIGA</span>
      </div>

      <p className="px-5 pb-3 pt-6 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-400">
        {space}
      </p>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const body = (
            <>
              <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              <span className="flex-1 text-start">{t(item.label)}</span>
              {item.count > 0 && (
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11.5px] font-semibold ${countCls}`}
                >
                  {item.count}
                </span>
              )}
            </>
          )

          // `label` est unique par entrée ; `to` ne l'est pas (écrans à venir).
          if (!item.to) {
            return (
              <button
                key={item.label}
                type="button"
                title="Écran à venir"
                className={`${itemCls({ isActive: false })} w-full opacity-50`}
              >
                {body}
              </button>
            )
          }

          return (
            <NavLink key={item.label} to={item.to} end={item.end} className={itemCls}>
              {body}
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-0.5 p-3">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-ink-600 transition-colors hover:bg-white hover:text-ink"
        >
          <Languages className="h-4 w-4" strokeWidth={1.75} />
          {other}
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] text-ink-600 transition-colors hover:bg-white hover:text-ink"
        >
          <LogOut className="flip-rtl h-4 w-4" strokeWidth={1.75} />
          {t('dash.logout')}
        </button>
      </div>
    </div>
  )

  const side = 'border-sand-200 bg-sand-100/60 backdrop-blur-xl'

  return (
    <div className="flex min-h-screen bg-sand-50">
      {/* Navigation fixe (desktop) */}
      <aside className={`fixed inset-y-0 start-0 hidden w-64 border-e lg:block ${side}`}>{sidebar}</aside>

      {/* Panneau mobile */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
          <aside className={`fixed inset-y-0 start-0 z-50 w-64 animate-fade border-e lg:hidden ${side}`}>
            {sidebar}
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:ms-64">
        {/* Barre supérieure */}
        <header className="sticky top-0 z-30 border-b border-sand-200/70 bg-sand-50/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-5 sm:px-8">
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sand-200 bg-white/70 text-ink-600 transition-colors hover:bg-white lg:hidden"
              aria-label={t('nav.menu')}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <h1 className="min-w-0 flex-1 truncate font-display text-[20px] text-ink">{title}</h1>

            {/* Le champ de recherche décoratif a été retiré : il ne cherchait
                rien et chaque écran porte déjà ses propres filtres. */}
            <NotificationsBell items={notifications} variant={variant} />

            <div className="flex items-center gap-2.5 rounded-xl border border-sand-200 bg-white/70 py-1 ps-1 pe-3">
              <Avatar name={user} src={avatar} size="sm" />
              <span className="hidden text-[14px] font-medium text-ink-600 sm:block">{user}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-8 sm:px-8 sm:py-10">
          {action && <div className="mb-8 flex justify-end">{action}</div>}
          {children}
        </main>
      </div>
    </div>
  )
}
