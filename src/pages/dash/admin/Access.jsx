import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CircleAlert, CircleCheck, CircleHelp, Copy, KeyRound, Mail, Phone, X } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { fetchResetRequests, resolveResetRequest, setTemporaryPassword } from '../../../lib/admin'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import ContactLine from '../../../components/dashboard/ContactLine'
import { Textarea } from '../../../components/ui/Field'
import { useAdmin } from './AdminLayout'

/** Résultat de la vérification faite par la base au dépôt de la demande. */
function MatchBadge({ r }) {
  const { t } = useI18n()
  if (!r.profileId) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-2.5 py-1 text-[12.5px] font-medium text-ink-600">
        <CircleHelp className="h-3.5 w-3.5" />
        {t('admin.resetNoAccount')}
      </span>
    )
  }
  return r.phoneMatches ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-vert-50 px-2.5 py-1 text-[12.5px] font-medium text-vert-700">
      <CircleCheck className="h-3.5 w-3.5" />
      {t('admin.resetPhoneOk')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[12.5px] font-medium text-red-700">
      <CircleAlert className="h-3.5 w-3.5" />
      {t('admin.resetPhoneMismatch')}
    </span>
  )
}

/** Une demande en attente : compte retrouvé, numéro enregistré, actions. */
function RequestCard({ r, onDone }) {
  const { t, d } = useI18n()
  const [mode, setMode] = useState(null) // null | generate | reject
  const [note, setNote] = useState('')
  const [temp, setTemp] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setError('')
    setBusy(true)
    try {
      setTemp(await setTemporaryPassword(r.profileId))
      await resolveResetRequest(r.id, 'done', note || t('admin.resetAutoNote'))
      setMode(null)
    } catch (e) {
      setError(`${t('admin.tempPasswordError')} ${e.message || ''}`.trim())
    } finally {
      setBusy(false)
    }
  }

  const reject = async () => {
    setError('')
    setBusy(true)
    try {
      await resolveResetRequest(r.id, 'rejected', note)
      onDone(r.id)
    } catch {
      setError(t('dash.actionError'))
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

  const btn = 'inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[13.5px] font-medium transition-colors disabled:opacity-50'

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] font-medium text-ink">
            <span dir="ltr" className="flex items-center gap-1.5 tabular-nums">
              <Phone className="h-4 w-4 text-ink-400" />
              {r.phone}
            </span>
            {r.email && (
              <span dir="ltr" className="flex items-center gap-1.5 font-normal text-ink-600">
                <Mail className="h-4 w-4 text-ink-400" />
                {r.email}
              </span>
            )}
          </p>
          <p className="mt-1 text-[13px] text-ink-400">{t('admin.resetRequestedOn')} {d(r.date)} · {r.time} UTC</p>
        </div>
        <MatchBadge r={r} />
      </div>

      {r.profileId && (
        <div className="mt-4 rounded-xl bg-sand-50 px-4 py-3">
          <p className="text-[14px] text-ink-600">
            {t('admin.resetAccount')}{' '}
            <Link to={`/admin/utilisateurs/${r.profileId}`} className="font-medium text-ink hover:text-vert-700 hover:underline">
              {r.name}
            </Link>
            {r.role && <> · {t(`admin.${r.role}`)}</>}
            {r.suspended && <> · <span className="text-red-600">{t('admin.suspended')}</span></>}
          </p>
          {/* Le seul numéro auquel transmettre le mot de passe : celui du compte. */}
          <ContactLine label={t('admin.resetRegisteredPhone')} phone={r.registeredPhone} />
        </div>
      )}

      {r.profileId && !r.phoneMatches && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] leading-relaxed text-red-800">
          {t('admin.resetMismatchWarning')}
        </p>
      )}

      {temp ? (
        <div className="mt-4 rounded-xl border border-vert-100 bg-vert-50/70 p-4">
          <p className="text-[13.5px] text-ink-600">{t('admin.resetTempIntro')}</p>
          <div className="mt-2 flex items-center gap-2">
            <code dir="ltr" className="flex-1 select-all rounded-lg bg-white px-3 py-2 text-[17px] font-semibold tracking-wider text-ink ring-1 ring-sand-200">
              {temp}
            </code>
            <button onClick={copy} title={t('admin.copy')} className="grid h-10 w-10 place-items-center rounded-lg border border-sand-300 bg-white text-ink-600 transition-colors hover:text-vert-700">
              {copied ? <Check className="h-4 w-4 text-vert-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-400">{t('admin.tempPasswordHint')}</p>
          <button onClick={() => onDone(r.id)} className={`${btn} mt-3 border-vert-700 bg-vert-700 text-sand-50 hover:bg-vert-800`}>
            <Check className="h-4 w-4" />
            {t('admin.resetFinish')}
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {r.profileId && !r.suspended && (
              <button onClick={() => setMode(mode === 'generate' ? null : 'generate')} disabled={busy} className={`${btn} border-vert-100 bg-vert-50 text-vert-700 hover:bg-vert-700 hover:text-sand-50`}>
                <KeyRound className="h-4 w-4" />
                {t('admin.tempPassword')}
              </button>
            )}
            <button onClick={() => setMode(mode === 'reject' ? null : 'reject')} disabled={busy} className={`${btn} border-sand-300 bg-white text-ink-600 hover:border-ocre-500 hover:text-ocre-700`}>
              <X className="h-4 w-4" />
              {t('admin.resetReject')}
            </button>
          </div>

          {mode && (
            <div className={`mt-3 rounded-xl border p-4 ${mode === 'generate' ? 'border-ocre-300/70 bg-ocre-50' : 'border-sand-200 bg-sand-50'}`}>
              <p className="text-[13.5px] leading-relaxed text-ink-800">
                {t(mode === 'generate' ? 'admin.resetGenerateConfirm' : 'admin.resetRejectConfirm')}
              </p>
              <div className="mt-3">
                <Textarea label={t('admin.resolutionNote')} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={mode === 'generate' ? generate : reject}
                  disabled={busy}
                  className="h-9 rounded-lg bg-ocre-700 px-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-ocre-500 disabled:opacity-50"
                >
                  {busy ? '…' : t(mode === 'generate' ? 'admin.tempPasswordGo' : 'admin.resetReject')}
                </button>
                <button onClick={() => setMode(null)} className="h-9 rounded-lg border border-sand-300 bg-white px-3.5 text-[13.5px] text-ink-600 transition-colors hover:text-ink">
                  {t('dash.cancel')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && <p className="mt-3 text-[13.5px] text-red-600">{error}</p>}
    </Panel>
  )
}

function History() {
  const { t, d } = useI18n()
  const [list, setList] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([fetchResetRequests('done'), fetchResetRequests('rejected')])
      .then(([done, rejected]) => {
        if (active) setList([...done, ...rejected].sort((a, b) => (b.resolvedAt || '').localeCompare(a.resolvedAt || '')))
      })
      .catch(() => { if (active) setList([]) })
    return () => { active = false }
  }, [])

  if (list === null) return <div className="h-40 animate-pulse rounded-2xl bg-sand-100" aria-hidden="true" />

  return (
    <Panel bodyClass="">
      {list.length === 0 ? (
        <p className="px-6 py-14 text-center text-[14.5px] text-ink-400">{t('admin.resetNoHistory')}</p>
      ) : (
        <ul className="divide-y divide-sand-200">
          {list.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-ink">
                  {r.name || t('admin.resetNoAccount')} <span dir="ltr" className="font-normal text-ink-400">{r.phone}</span>
                </p>
                <p className="mt-1 text-[13px] text-ink-400">{t('admin.resetRequestedOn')} {d(r.date)}</p>
                {r.adminNote && <p className="mt-2 text-[14px] text-ink-600">{r.adminNote}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill status={r.status === 'done' ? 'online' : 'closed'}>{t(`admin.resetStatus.${r.status}`)}</StatusPill>
                {r.resolvedAt && <span className="text-[12.5px] text-ink-400">{t('admin.resolvedOn')} {d(r.resolvedAt)}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

/** Module Accès : demandes de réinitialisation déposées sans e-mail. */
export default function Access() {
  const { t, n } = useI18n()
  const { resetRequests, dropResetRequest } = useAdmin()
  const [tab, setTab] = useState('open')

  const tabs = [
    { id: 'open', label: t('admin.reportsOpen'), count: resetRequests.length },
    { id: 'closed', label: t('admin.reportsClosed') },
  ]

  return (
    <>
      <div className="mb-6 flex gap-1 border-b border-sand-200/70" role="tablist">
        {tabs.map((x) => {
          const on = tab === x.id
          return (
            <button
              key={x.id}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(x.id)}
              className={`relative -mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-[14.5px] transition-colors ${
                on ? 'border-vert-700 text-vert-700' : 'border-transparent text-ink-400 hover:text-ink'
              }`}
            >
              {x.label}
              {x.count != null && (
                <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11.5px] ${on ? 'bg-vert-700 text-sand-50' : 'bg-sand-200 text-ink-600'}`}>
                  {n(x.count)}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'closed' ? (
        <History />
      ) : resetRequests.length === 0 ? (
        <Panel>
          <div className="flex flex-col items-center py-14 text-center">
            <KeyRound className="h-7 w-7 text-sand-400" strokeWidth={1.25} />
            <p className="mt-4 font-display text-lg text-ink">{t('admin.resetNoPending')}</p>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4">
          {resetRequests.map((r) => <RequestCard key={r.id} r={r} onDone={dropResetRequest} />)}
        </div>
      )}
    </>
  )
}
