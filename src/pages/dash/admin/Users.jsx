import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Check, Copy, ImageOff, KeyRound, Mail, Phone, Search, ShieldOff, ShieldCheck, ShieldQuestion, Trash2, TriangleAlert, Undo2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useTrades } from '../../../trades/TradesProvider'
import { CITIES } from '../../../data/mock'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import Avatar from '../../../components/ui/Avatar'
import { Input, Select } from '../../../components/ui/Field'
import ContactLine from '../../../components/dashboard/ContactLine'
import { setTemporaryPassword } from '../../../lib/admin'
import { fetchContacts } from '../../../lib/contact'
import { useAdmin } from './AdminLayout'

const STATUS_TONE = { active: 'online', pending: 'pending', suspended: 'closed' }

export default function Users() {
  const { t, n, d } = useI18n()
  const { tradeLabel } = useTrades()
  const { users, queue, patchUser, removeUser } = useAdmin()
  // Statut du compte et vérification d'identité sont indépendants : un compte
  // actif peut avoir une pièce d'identité en attente, on le signale à côté.
  const identityPending = new Set(queue.filter((x) => x.kind === 'profile').map((x) => x.profileId))

  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [resettingId, setResettingId] = useState(null)

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

  const remove = async (u) => {
    setError('')
    setMessage('')
    setDeletingId(u.id)
    try {
      await removeUser(u.id)
      setConfirmingId(null)
      setMessage(`${t('admin.userDeleted')} ${u.name}`)
    } catch (e) {
      setError(`${t('admin.deleteError')} ${e.message || ''}`.trim())
    } finally {
      setDeletingId(null)
    }
  }

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const digits = needle.replace(/\D/g, '')
    const matches = (u) =>
      u.name.toLowerCase().includes(needle) ||
      u.email.toLowerCase().includes(needle) ||
      (digits.length >= 3 && u.phone.replace(/\D/g, '').includes(digits))
    return users.filter(
      (u) =>
        (!needle || matches(u)) &&
        (!role || u.role === role) &&
        (!status || u.status === status) &&
        (!city || u.city === city)
    )
  }, [users, q, role, status, city])

  return (
    <>
      {error && <p className="mb-6 text-[14px] text-red-600">{error}</p>}
      {message && <p className="mb-6 text-[14px] text-vert-700">{message}</p>}

      {/* Filtres */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="relative block">
          <span className="mb-1.5 block text-[14px] font-medium text-ink-800">{t('common.search')}</span>
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
          <span className="text-[13.5px] text-ink-400">
            <span className="font-medium text-ink">{n(list.length)}</span> {t('common.results')}
          </span>
        }
      >
        {/* Tableau (desktop) */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-start text-[14px]">
            <thead>
              <tr className="border-b border-sand-200/70 bg-sand-50/50 text-[12px] uppercase tracking-[0.1em] text-ink-400">
                <th className="px-6 py-3 text-start font-medium">{t('contact.name')}</th>
                <th className="px-6 py-3 text-start font-medium">{t('admin.contact')}</th>
                <th className="px-6 py-3 text-start font-medium">{t('admin.role')}</th>
                <th className="px-6 py-3 text-start font-medium">{t('common.city')}</th>
                <th className="px-6 py-3 text-start font-medium">{t('admin.joined')}</th>
                <th className="px-6 py-3 text-start font-medium">{t('admin.accountStatus')}</th>
                <th className="px-6 py-3 text-end font-medium">{t('dash.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {list.map((u) => (
                <Fragment key={u.id}>
                <tr className="transition-colors hover:bg-sand-50/70">
                  <td className="px-6 py-3.5">
                    <span className="flex items-center gap-3">
                      <Avatar name={u.name} src={u.avatar} size="sm" />
                      <Link to={`/admin/utilisateurs/${u.id}`} className="flex items-center gap-1.5 font-medium text-ink hover:text-vert-700 hover:underline">
                        {u.name}
                        {u.verified && <BadgeCheck className="h-3.5 w-3.5 text-vert-600" />}
                      </Link>
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <ContactCell u={u} />
                  </td>
                  <td className="px-6 py-3.5 text-ink-600">
                    {t(`admin.${u.role}`)}
                    {u.trade && <span className="text-ink-400"> · {tradeLabel(u.trade)}</span>}
                  </td>
                  <td className="px-6 py-3.5 text-ink-600">{u.city ? t(`cities.${u.city}`) : ''}</td>
                  <td className="px-6 py-3.5 tabular-nums text-ink-400">{d(u.joined)}</td>
                  <td className="px-6 py-3.5">
                    <span className="flex flex-col items-start gap-1.5">
                    <StatusPill status={STATUS_TONE[u.status]}>{t(`admin.${u.status}`)}</StatusPill>
                    {identityPending.has(u.id) && (
                    <Link to="/admin/verifications" className="inline-flex items-center gap-1 rounded-full bg-ocre-100 px-2 py-0.5 text-[12px] font-medium text-ocre-700 hover:bg-ocre-300/40">
                      <ShieldQuestion className="h-3 w-3" />
                      {t('admin.identityPending')}
                    </Link>
                    )}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="flex justify-end gap-1.5">
                      <RowActions
                        u={u}
                        patchUser={apply}
                        onDelete={() => { setResettingId(null); setConfirmingId(u.id) }}
                        onResetPassword={() => { setConfirmingId(null); setResettingId(resettingId === u.id ? null : u.id) }}
                        t={t}
                      />
                    </span>
                  </td>
                </tr>
                {confirmingId === u.id && (
                  <tr>
                    <td colSpan={7} className="px-6 pb-4">
                    <ConfirmDelete
                      u={u}
                      busy={deletingId === u.id}
                      onConfirm={() => remove(u)}
                      onCancel={() => setConfirmingId(null)}
                    />
                    </td>
                  </tr>
                )}
                {resettingId === u.id && (
                  <tr>
                    <td colSpan={7} className="px-6 pb-4">
                      <ResetPasswordBox u={u} onClose={() => setResettingId(null)} />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cartes (mobile) */}
        <ul className="divide-y divide-sand-200 lg:hidden">
          {list.map((u) => (
            <li key={u.id} className="px-6 py-4">
              <div className="flex items-center gap-3.5">
                <Avatar name={u.name} src={u.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/utilisateurs/${u.id}`} className="flex items-center gap-1.5 truncate text-[14.5px] font-medium text-ink hover:text-vert-700">
                    {u.name}
                    {u.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-vert-600" />}
                  </Link>
                  <p className="mt-0.5 truncate text-[12.5px] text-ink-400">
                    {t(`admin.${u.role}`)}{u.city ? ` · ${t(`cities.${u.city}`)}` : ''}
                  </p>
                  <div className="mt-1.5">
                    <ContactCell u={u} />
                  </div>
                </div>
                <StatusPill status={STATUS_TONE[u.status]}>{t(`admin.${u.status}`)}</StatusPill>
              </div>
              {identityPending.has(u.id) && (
                <div className="mt-2">
                    <Link to="/admin/verifications" className="inline-flex items-center gap-1 rounded-full bg-ocre-100 px-2 py-0.5 text-[12px] font-medium text-ocre-700 hover:bg-ocre-300/40">
                      <ShieldQuestion className="h-3 w-3" />
                      {t('admin.identityPending')}
                    </Link>
                </div>
              )}
              <div className="mt-3 flex gap-1.5">
                <RowActions
                        u={u}
                        patchUser={apply}
                        onDelete={() => { setResettingId(null); setConfirmingId(u.id) }}
                        onResetPassword={() => { setConfirmingId(null); setResettingId(resettingId === u.id ? null : u.id) }}
                        t={t}
                      />
              </div>
              {confirmingId === u.id && (
                <div className="mt-3">
                    <ConfirmDelete
                      u={u}
                      busy={deletingId === u.id}
                      onConfirm={() => remove(u)}
                      onCancel={() => setConfirmingId(null)}
                    />
                </div>
              )}
              {resettingId === u.id && (
                <div className="mt-3">
                  <ResetPasswordBox u={u} onClose={() => setResettingId(null)} />
                </div>
              )}
            </li>
          ))}
        </ul>

        {list.length === 0 && (
          <p className="px-6 py-14 text-center text-[14.5px] text-ink-400">{t('common.empty')}</p>
        )}
      </Panel>
    </>
  )
}

/** E-mail et téléphone d'un compte, sélectionnables pour être copiés. */
function ContactCell({ u }) {
  if (!u.email && !u.phone) return null
  return (
    <span className="flex flex-col gap-0.5 text-[13.5px] leading-snug">
      {u.email && (
        <span dir="ltr" className="flex items-center gap-1.5 text-start text-ink-600">
          <Mail className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span className="select-all break-all">{u.email}</span>
        </span>
      )}
      {u.phone && (
        <span dir="ltr" className="flex items-center gap-1.5 text-start tabular-nums text-ink-600">
          <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span className="select-all whitespace-nowrap">{u.phone}</span>
        </span>
      )}
    </span>
  )
}

/** Boutons d'action d'un compte : partagés par le tableau, les cartes et la fiche. */
export function RowActions({ u, patchUser, onDelete, onResetPassword, t }) {
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

      {u.avatarPath && (
        <button
          onClick={() => patchUser(u.id, { avatar: null })}
          title={t('admin.removeAvatar')}
          className={`${btn} border-sand-300 bg-white text-ink-400 hover:border-ocre-500 hover:text-ocre-700`}
        >
          <ImageOff className="h-4 w-4" />
        </button>
      )}

      {onResetPassword && (
        <button
          onClick={onResetPassword}
          title={t('admin.resetPassword')}
          className={`${btn} border-sand-300 bg-white text-ink-400 hover:border-vert-200 hover:text-vert-700`}
        >
          <KeyRound className="h-4 w-4" />
        </button>
      )}

      <button
        onClick={onDelete}
        title={t('admin.deleteUser')}
        className={`${btn} border-sand-300 bg-white text-ink-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  )
}

/**
 * Confirmation de suppression : irréversible, elle dit ce qui part avec le
 * compte et ne tient pas en un clic.
 */
export function ConfirmDelete({ u, busy, onConfirm, onCancel }) {
  const { t } = useI18n()
  return (
    <div role="alertdialog" aria-label={t('admin.deleteUser')} className="rounded-xl border border-red-200 bg-red-50/70 p-4">
      <p className="flex items-start gap-2.5 text-[14px] leading-relaxed text-red-800">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {t('admin.deleteConfirmBefore')} <strong className="font-semibold">{u.name}</strong>{t('admin.deleteConfirmAfter')}{' '}
          {t(u.role === 'employer' ? 'admin.deleteWhatEmployer' : 'admin.deleteWhatWorker')}
        </span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2 ps-6">
        <button
          onClick={onConfirm}
          disabled={busy}
          className="h-9 rounded-lg bg-red-600 px-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? t('admin.deleting') : t('admin.confirmDeleteUser')}
        </button>
        <button
          onClick={onCancel}
          disabled={busy}
          className="h-9 rounded-lg border border-sand-300 bg-white px-3.5 text-[13.5px] text-ink-600 transition-colors hover:text-ink"
        >
          {t('dash.cancel')}
        </button>
      </div>
    </div>
  )
}

/**
 * Réinitialisation depuis la liste : confirmation, puis mot de passe temporaire
 * affiché une seule fois, à transmettre au numéro enregistré (rappelé ici).
 * Le compte devra choisir le sien à sa prochaine connexion.
 */
function ResetPasswordBox({ u, onClose }) {
  const { t } = useI18n()
  const [phone, setPhone] = useState(undefined) // undefined = chargement
  const [temp, setTemp] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchContacts([u.id])
      .then((c) => { if (active) setPhone(c[u.id] || '') })
      .catch(() => { if (active) setPhone('') })
    return () => { active = false }
  }, [u.id])

  const generate = async () => {
    setError('')
    setBusy(true)
    try {
      setTemp(await setTemporaryPassword(u.id))
    } catch (e) {
      setError(`${t('admin.tempPasswordError')} ${e.message || ''}`.trim())
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(temp)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Presse-papiers indisponible : le mot de passe reste sélectionnable.
    }
  }

  return (
    <div className="rounded-xl border border-ocre-300/70 bg-ocre-50 p-4">
      {temp ? (
        <>
          <p className="text-[13.5px] text-ink-600">{t('admin.resetTempIntro')}</p>
          <div className="mt-2 flex max-w-md items-center gap-2">
            <code dir="ltr" className="flex-1 select-all rounded-lg bg-white px-3 py-2 text-[17px] font-semibold tracking-wider text-ink ring-1 ring-sand-200">
              {temp}
            </code>
            <button onClick={copy} title={t('admin.copy')} className="grid h-10 w-10 place-items-center rounded-lg border border-sand-300 bg-white text-ink-600 transition-colors hover:text-vert-700">
              {copied ? <Check className="h-4 w-4 text-vert-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-400">{t('admin.tempPasswordHint')}</p>
        </>
      ) : (
        <p className="text-[14px] leading-relaxed text-ink-800">
          {t('admin.resetPasswordFor')} <strong className="font-semibold">{u.name}</strong>. {t('admin.resetGenerateConfirm')}
        </p>
      )}

      {phone !== undefined && <ContactLine label={t('admin.resetRegisteredPhone')} phone={phone} />}

      {error && <p className="mt-3 text-[13.5px] text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {!temp && (
          <button
            onClick={generate}
            disabled={busy}
            className="h-9 rounded-lg bg-ocre-700 px-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-ocre-500 disabled:opacity-50"
          >
            {busy ? '…' : t('admin.tempPasswordGo')}
          </button>
        )}
        <button
          onClick={onClose}
          className="h-9 rounded-lg border border-sand-300 bg-white px-3.5 text-[13.5px] text-ink-600 transition-colors hover:text-ink"
        >
          {temp ? t('admin.resetFinish') : t('dash.cancel')}
        </button>
      </div>
    </div>
  )
}
