import { useMemo, useState } from 'react'
import { BadgeCheck, Search, ShieldOff, ShieldCheck, Undo2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useTrades } from '../../../trades/TradesProvider'
import { CITIES } from '../../../data/mock'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import Avatar from '../../../components/ui/Avatar'
import { Input, Select } from '../../../components/ui/Field'
import { useAdmin } from './AdminLayout'

const STATUS_TONE = { active: 'online', pending: 'pending', suspended: 'closed' }

export default function Users() {
  const { t, n, d } = useI18n()
  const { tradeLabel } = useTrades()
  const { users, patchUser } = useAdmin()

  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')

  // `patchUser` remonte l'erreur : sans ce relais, un refus de droits côté
  // base ne laissait aucune trace à l'écran.
  const apply = async (id, patch) => {
    setError('')
    try {
      await patchUser(id, patch)
    } catch {
      setError(t('dash.actionError'))
    }
  }

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return users.filter(
      (u) =>
        (!needle || u.name.toLowerCase().includes(needle)) &&
        (!role || u.role === role) &&
        (!status || u.status === status) &&
        (!city || u.city === city)
    )
  }, [users, q, role, status, city])

  return (
    <>
      {error && <p className="mb-6 text-[13px] text-red-600">{error}</p>}

      {/* Filtres */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="relative block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-800">{t('common.search')}</span>
          <Search className="pointer-events-none absolute bottom-3.5 start-3.5 h-4 w-4 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('admin.searchUser')}
            className="h-11 w-full rounded-xl border border-sand-300 bg-white ps-10 pe-3.5 text-sm outline-none transition-colors hover:border-sand-400 focus:border-vert-700"
          />
        </label>

        <Select label={t('admin.role')} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">{t('admin.allRoles')}</option>
          <option value="employer">{t('admin.employer')}</option>
          <option value="worker">{t('admin.worker')}</option>
        </Select>

        <Select label={t('dash.status')} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('admin.allStatus')}</option>
          <option value="active">{t('admin.active')}</option>
          <option value="pending">{t('admin.pending')}</option>
          <option value="suspended">{t('admin.suspended')}</option>
        </Select>

        <Select label={t('common.city')} value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">{t('common.allCities')}</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{t(`cities.${c}`)}</option>
          ))}
        </Select>
      </div>

      <Panel
        title={t('dash.users')}
        bodyClass=""
        className="mt-6"
        action={
          <span className="text-[12.5px] text-ink-400">
            <span className="font-medium text-ink">{n(list.length)}</span> {t('common.results')}
          </span>
        }
      >
        {/* Tableau (desktop) */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-start text-[13px]">
            <thead>
              <tr className="border-b border-sand-200/70 bg-sand-50/50 text-[11px] uppercase tracking-[0.1em] text-ink-400">
                <th className="px-6 py-3 text-start font-medium">{t('contact.name')}</th>
                <th className="px-6 py-3 text-start font-medium">{t('admin.role')}</th>
                <th className="px-6 py-3 text-start font-medium">{t('common.city')}</th>
                <th className="px-6 py-3 text-start font-medium">{t('admin.joined')}</th>
                <th className="px-6 py-3 text-start font-medium">{t('dash.status')}</th>
                <th className="px-6 py-3 text-end font-medium">{t('dash.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {list.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-sand-50/70">
                  <td className="px-6 py-3.5">
                    <span className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        {u.name}
                        {u.verified && <BadgeCheck className="h-3.5 w-3.5 text-vert-600" />}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-ink-600">
                    {t(`admin.${u.role}`)}
                    {u.trade && <span className="text-ink-400"> · {tradeLabel(u.trade)}</span>}
                  </td>
                  <td className="px-6 py-3.5 text-ink-600">{u.city ? t(`cities.${u.city}`) : '—'}</td>
                  <td className="px-6 py-3.5 tabular-nums text-ink-400">{d(u.joined)}</td>
                  <td className="px-6 py-3.5">
                    <StatusPill status={STATUS_TONE[u.status]}>{t(`admin.${u.status}`)}</StatusPill>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="flex justify-end gap-1.5">
                      <RowActions u={u} patchUser={apply} t={t} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cartes (mobile) */}
        <ul className="divide-y divide-sand-200 lg:hidden">
          {list.map((u) => (
            <li key={u.id} className="px-6 py-4">
              <div className="flex items-center gap-3.5">
                <Avatar name={u.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[13.5px] font-medium text-ink">
                    {u.name}
                    {u.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-vert-600" />}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-ink-400">
                    {t(`admin.${u.role}`)}{u.city ? ` · ${t(`cities.${u.city}`)}` : ''}
                  </p>
                </div>
                <StatusPill status={STATUS_TONE[u.status]}>{t(`admin.${u.status}`)}</StatusPill>
              </div>
              <div className="mt-3 flex gap-1.5">
                <RowActions u={u} patchUser={apply} t={t} />
              </div>
            </li>
          ))}
        </ul>

        {list.length === 0 && (
          <p className="px-6 py-14 text-center text-[13.5px] text-ink-400">{t('common.empty')}</p>
        )}
      </Panel>
    </>
  )
}

/** Boutons d'action d'une ligne — partagés entre le tableau et les cartes. */
function RowActions({ u, patchUser, t }) {
  const btn =
    'grid h-9 w-9 place-items-center rounded-lg border transition-colors disabled:opacity-30'

  return (
    <>
      <button
        onClick={() => patchUser(u.id, { verified: !u.verified, status: u.verified ? u.status : 'active' })}
        title={u.verified ? t('admin.unverify') : t('admin.verify')}
        className={`${btn} ${
          u.verified
            ? 'border-sand-300 bg-white text-ink-400 hover:border-ink-400'
            : 'border-vert-100 bg-vert-50 text-vert-700 hover:bg-vert-700 hover:text-sand-50'
        }`}
      >
        <BadgeCheck className="h-4 w-4" />
      </button>

      {u.status === 'suspended' ? (
        <button
          onClick={() => patchUser(u.id, { status: 'active' })}
          title={t('admin.restore')}
          className={`${btn} border-vert-100 bg-vert-50 text-vert-700 hover:bg-vert-700 hover:text-sand-50`}
        >
          <Undo2 className="flip-rtl h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={() => patchUser(u.id, { status: 'suspended' })}
          title={t('admin.suspend')}
          className={`${btn} border-sand-300 bg-white text-ink-400 hover:border-ocre-500 hover:text-ocre-700`}
        >
          <ShieldOff className="h-4 w-4" />
        </button>
      )}
    </>
  )
}
