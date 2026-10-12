import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ExternalLink, EyeOff, Flag, Quote, ShieldOff, UserRound } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { fetchReports } from '../../../lib/admin'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import { Select, Textarea } from '../../../components/ui/Field'
import { useAdmin } from './AdminLayout'

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 }
const STRIPE = { high: 'bg-red-500', medium: 'bg-ocre-500', low: 'bg-sand-300' }
const RESOLUTION_TONE = { dismissed: 'closed', content_removed: 'pending', account_suspended: 'high' }

/**
 * Regroupe les signalements ouverts par cible : trois personnes qui signalent
 * la même annonce, c'est un dossier, pas trois. Tri : gravité, puis volume,
 * puis le plus récent.
 */
function groupByTarget(reports) {
  const groups = new Map()
  for (const r of reports) {
    const key = `${r.kind}:${r.jobId || r.workerId}`
    if (!groups.has(key)) groups.set(key, { key, ...r, items: [] })
    const g = groups.get(key)
    g.items.push(r)
    if (SEVERITY_RANK[r.severity] < SEVERITY_RANK[g.severity]) g.severity = r.severity
    if (r.date > g.date) g.date = r.date
  }
  return [...groups.values()].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      b.items.length - a.items.length ||
      b.date.localeCompare(a.date)
  )
}

/** Décision sur un dossier : confirmation avec note interne facultative. */
function DecisionForm({ label, confirmLabel, tone, busy, onConfirm, onCancel }) {
  const { t } = useI18n()
  const [note, setNote] = useState('')
  const box = tone === 'danger' ? 'border-ocre-300/70 bg-ocre-50' : 'border-sand-200 bg-sand-50'
  return (
    <form
      className={`mt-4 rounded-xl border p-4 ${box}`}
      onSubmit={(e) => {
        e.preventDefault()
        onConfirm(note)
      }}
    >
      <p className="text-[14px] font-medium text-ink-800">{label}</p>
      <div className="mt-3">
        <Textarea
          label={t('admin.resolutionNote')}
          rows={2}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className={`h-9 rounded-lg px-3.5 text-[13.5px] font-medium text-white transition-colors disabled:opacity-50 ${
            tone === 'danger' ? 'bg-ocre-700 hover:bg-ocre-500' : 'bg-vert-700 hover:bg-vert-800'
          }`}
        >
          {busy ? '…' : confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-sand-300 bg-white px-3.5 text-[13.5px] text-ink-600 transition-colors hover:text-ink"
        >
          {t('dash.cancel')}
        </button>
      </div>
    </form>
  )
}

/** Lien vers la cible : l'annonce publique, ou la fiche admin du compte (avec ses actions). */
function TargetLink({ r, children, className }) {
  const to = r.kind === 'job' ? `/offres/${r.jobId}` : `/admin/utilisateurs/${r.workerId}`
  return <Link to={to} className={className}>{children}</Link>
}

function OpenReports() {
  const { t, n, d } = useI18n()
  const { reports, resolveReports } = useAdmin()
  const [severity, setSeverity] = useState('')
  const [kind, setKind] = useState('')
  const [deciding, setDeciding] = useState(null) // `${groupKey}:${action}`
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const groups = useMemo(
    () => groupByTarget(reports).filter((g) => (!severity || g.severity === severity) && (!kind || g.kind === kind)),
    [reports, severity, kind]
  )

  const decide = async (g, action, note) => {
    setError('')
    setBusy(true)
    try {
      await resolveReports(g.items.map((r) => r.id), action, { jobId: g.jobId, workerId: g.workerId, note })
      setDeciding(null)
    } catch {
      setError(t('dash.actionError'))
    } finally {
      setBusy(false)
    }
  }

  const actionBtn = 'inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[13.5px] font-medium transition-colors'

  return (
    <>
      <div className="mb-5 grid gap-3 sm:max-w-xl sm:grid-cols-2">
        <Select value={severity} onChange={(e) => setSeverity(e.target.value)} aria-label={t('admin.severity')}>
          <option value="">{t('admin.allSeverities')}</option>
          {['high', 'medium', 'low'].map((s) => <option key={s} value={s}>{t(`severity.${s}`)}</option>)}
        </Select>
        <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label={t('admin.reportKind')}>
          <option value="">{t('admin.allKinds')}</option>
          <option value="job">{t('dash.job')}</option>
          <option value="profile">{t('dash.profile')}</option>
        </Select>
      </div>

      {error && <p className="mb-4 text-[14px] text-red-600">{error}</p>}

      {groups.length === 0 ? (
        <Panel>
          <div className="flex flex-col items-center py-14 text-center">
            <Flag className="h-7 w-7 text-sand-400" strokeWidth={1.25} />
            <p className="mt-4 font-display text-lg text-ink">{t('admin.noReports')}</p>
          </div>
        </Panel>
      ) : (
        <div className="grid gap-4">
          {groups.map((g) => {
            const isJob = g.kind === 'job'
            const at = (action) => deciding === `${g.key}:${action}`
            const toggle = (action) => setDeciding(at(action) ? null : `${g.key}:${action}`)

            return (
              <Panel key={g.key} className="relative">
                {/* Liseré de gravité : le plus urgent se repère sans lire. */}
                <span className={`absolute inset-y-0 start-0 w-1 ${STRIPE[g.severity]}`} aria-hidden="true" />

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <TargetLink r={g} className="font-display text-[19px] text-ink hover:text-vert-700 hover:underline">
                        {g.target}
                      </TargetLink>
                      <StatusPill status={g.severity}>{t(`severity.${g.severity}`)}</StatusPill>
                      {g.items.length > 1 && (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[12px] font-medium text-sand-50">
                          {n(g.items.length)} {t('admin.reportsCount')}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[13px] text-ink-400">
                      {t(`dash.${isJob ? 'job' : 'profile'}`)}
                      {isJob && !g.jobOnline && <> · {t('admin.alreadyOffline')}</>}
                      {!isJob && g.workerSuspended && <> · {t('admin.suspended')}</>}
                    </p>
                  </div>

                  <TargetLink r={g} className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-600 transition-colors hover:text-vert-700">
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('dash.inspect')}
                  </TargetLink>
                </div>

                {/* Chaque signalement du dossier : motif, auteur, précision. */}
                <ul className="mt-4 space-y-2.5">
                  {g.items.map((r) => (
                    <li key={r.id} className="rounded-xl bg-sand-50 px-4 py-3">
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px]">
                        <span className="font-medium text-ink">{t(`reportReason.${r.reason}`)}</span>
                        <span className="flex items-center gap-1.5 text-ink-400">
                          <UserRound className="h-3.5 w-3.5" />
                          {r.reporter || t('admin.deletedReporter')}
                        </span>
                        <span className="text-ink-400">{d(r.date)}</span>
                      </p>
                      {r.details && (
                        <p className="mt-2 flex gap-2 text-[14px] leading-relaxed text-ink-600">
                          <Quote className="mt-1 h-3 w-3 shrink-0 text-sand-400" />
                          {r.details}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap gap-2">
                  {isJob && g.jobId && g.jobOnline && (
                    <button onClick={() => toggle('retire')} className={`${actionBtn} border-sand-300 bg-white text-ink-600 hover:border-ocre-500 hover:text-ocre-700`}>
                      <EyeOff className="h-4 w-4" />
                      {t('admin.retireJob')}
                    </button>
                  )}
                  {!isJob && g.workerId && !g.workerSuspended && (
                    <button onClick={() => toggle('suspend')} className={`${actionBtn} border-sand-300 bg-white text-ink-600 hover:border-ocre-500 hover:text-ocre-700`}>
                      <ShieldOff className="h-4 w-4" />
                      {t('admin.suspendReported')}
                    </button>
                  )}
                  <button onClick={() => toggle('dismiss')} className={`${actionBtn} border-vert-100 bg-vert-50 text-vert-700 hover:bg-vert-700 hover:text-sand-50`}>
                    <Check className="h-4 w-4" />
                    {t('admin.dismissReport')}
                  </button>
                </div>

                {at('retire') && (
                  <DecisionForm tone="danger" busy={busy} label={t('admin.retireJobConfirm')} confirmLabel={t('admin.retireJob')}
                    onConfirm={(note) => decide(g, 'retire', note)} onCancel={() => setDeciding(null)} />
                )}
                {at('suspend') && (
                  <DecisionForm tone="danger" busy={busy} label={t('admin.suspendReportedConfirm')} confirmLabel={t('admin.suspend')}
                    onConfirm={(note) => decide(g, 'suspend', note)} onCancel={() => setDeciding(null)} />
                )}
                {at('dismiss') && (
                  <DecisionForm busy={busy} label={t('admin.dismissConfirm')} confirmLabel={t('admin.dismissReport')}
                    onConfirm={(note) => decide(g, 'dismiss', note)} onCancel={() => setDeciding(null)} />
                )}
              </Panel>
            )
          })}
        </div>
      )}
    </>
  )
}

/** Historique : chaque signalement traité, avec la décision et la note interne. */
function ClosedReports() {
  const { t, d } = useI18n()
  const [list, setList] = useState(null)

  useEffect(() => {
    let active = true
    fetchReports('closed')
      .then((rows) => { if (active) setList(rows) })
      .catch(() => { if (active) setList([]) })
    return () => { active = false }
  }, [])

  if (list === null) return <div className="h-40 animate-pulse rounded-2xl bg-sand-100" aria-hidden="true" />

  return (
    <Panel bodyClass="">
      {list.length === 0 ? (
        <p className="px-6 py-14 text-center text-[14.5px] text-ink-400">{t('admin.noClosedReports')}</p>
      ) : (
        <ul className="divide-y divide-sand-200">
          {list.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">
                  {r.target || t('admin.deletedTarget')}
                </p>
                <p className="mt-1 text-[13px] text-ink-400">
                  {t(`reportReason.${r.reason}`)} · {r.reporter || t('admin.deletedReporter')} · {d(r.date)}
                </p>
                {r.adminNote && <p className="mt-2 text-[14px] text-ink-600">{r.adminNote}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                {r.resolution && (
                  <StatusPill status={RESOLUTION_TONE[r.resolution]}>{t(`admin.resolution.${r.resolution}`)}</StatusPill>
                )}
                {r.resolvedAt && <span className="text-[12.5px] text-ink-400">{t('admin.resolvedOn')} {d(r.resolvedAt)}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export default function Reports() {
  const { t, n } = useI18n()
  const { reports } = useAdmin()
  const [tab, setTab] = useState('open')

  const tabs = [
    { id: 'open', label: t('admin.reportsOpen'), count: reports.length },
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

      {tab === 'open' ? <OpenReports /> : <ClosedReports />}
    </>
  )
}
