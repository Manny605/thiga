import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { useAuth } from '../../auth/AuthProvider'

/**
 * Cloche de notifications.
 *
 * Les éléments sont dérivés des données déjà chargées par chaque portail
 * (candidatures, file de modération, signalements) : pas de table dédiée.
 * L'état « lu » vit donc côté navigateur — il est propre à l'appareil, ce qui
 * suffit pour signaler ce qui est neuf depuis la dernière visite.
 *
 * L'identifiant d'un élément porte son statut (`app:<id>:shortlisted`) : un
 * changement de statut produit un identifiant neuf, donc une notification
 * neuve, sans avoir à dater la décision.
 */
const KEY = (userId) => `thiga.notifications.seen.${userId || 'anon'}`

function readSeen(userId) {
  try {
    const raw = window.localStorage.getItem(KEY(userId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeSeen(userId, ids) {
  try {
    window.localStorage.setItem(KEY(userId), JSON.stringify(ids))
  } catch {
    // Stockage indisponible (navigation privée) : la cloche reste utilisable,
    // seul le suivi du « déjà lu » est perdu.
  }
}

export default function NotificationsBell({ items = [], variant = 'user' }) {
  const { t, d } = useI18n()
  const { user } = useAuth()
  const userId = user?.id

  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState([])

  useEffect(() => {
    setSeen(readSeen(userId))
  }, [userId])

  const sorted = useMemo(
    () => [...items].sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [items]
  )

  const unread = sorted.filter((i) => !seen.includes(i.id))

  /** Ne conserve que les identifiants encore présents : la liste ne gonfle pas. */
  const markAllSeen = () => {
    const ids = sorted.map((i) => i.id)
    writeSeen(userId, ids)
    setSeen(ids)
  }

  const close = () => {
    setOpen(false)
    markAllSeen()
  }

  const badgeCls = variant === 'admin' ? 'bg-ocre-500' : 'bg-vert-600'

  return (
    <div className="relative">
      <button
        onClick={() => (open ? close() : setOpen(true))}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sand-200 bg-white/70 transition-colors hover:bg-white"
        aria-label={t('dash.notifications')}
        aria-expanded={open}
      >
        <Bell className="h-4 w-4 text-ink-600" strokeWidth={1.75} />
        {unread.length > 0 && (
          <span
            className={`absolute -end-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10.5px] font-semibold text-white ring-2 ring-sand-50 ${badgeCls}`}
          >
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden="true" />
          <div className="absolute end-0 top-12 z-50 w-80 animate-fade overflow-hidden rounded-xl border border-sand-200 bg-white shadow-lift">
            <header className="flex items-center justify-between gap-3 border-b border-sand-200/70 px-4 py-3">
              <p className="font-display text-[15px] text-ink">{t('notif.title')}</p>
              {unread.length > 0 && (
                <button
                  onClick={markAllSeen}
                  className="text-[12.5px] text-vert-700 transition-colors hover:underline"
                >
                  {t('notif.markAll')}
                </button>
              )}
            </header>

            {sorted.length === 0 ? (
              <p className="px-4 py-8 text-center text-[14px] text-ink-400">{t('notif.empty')}</p>
            ) : (
              <ul className="max-h-80 divide-y divide-sand-200/70 overflow-y-auto">
                {sorted.slice(0, 12).map((item) => {
                  const isUnread = !seen.includes(item.id)
                  return (
                    <li key={item.id}>
                      <Link
                        to={item.to}
                        onClick={close}
                        className={`flex gap-2.5 px-4 py-3 transition-colors hover:bg-sand-50 ${
                          isUnread ? 'bg-vert-50/40' : ''
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            isUnread ? badgeCls : 'bg-transparent'
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13.5px] font-medium text-ink">{item.title}</span>
                          <span className="mt-0.5 block truncate text-[12.5px] text-ink-600">{item.body}</span>
                          {item.date && (
                            <span className="mt-0.5 block text-[12px] text-ink-400">{d(item.date)}</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
