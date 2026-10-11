import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ExternalLink, Flag, ShieldOff, Trash2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import { useAdmin } from './AdminLayout'

export default function Reports() {
  const { t, d } = useI18n()
  const { reports, closeReport, deleteReportedJob, suspendReportedWorker } = useAdmin()
  const [confirming, setConfirming] = useState(null) // `${reportId}:${action}`
  const [error, setError] = useState('')

  const run = async (action) => {
    setConfirming(null)
    setError('')
    try {
      await action()
    } catch {
      setError(t('dash.actionError'))
    }
  }

  if (reports.length === 0) {
    return (
      <Panel>
        <div className="flex flex-col items-center py-14 text-center">
          <Flag className="h-7 w-7 text-sand-400" strokeWidth={1.25} />
          <p className="mt-4 font-display text-lg text-ink">{t('admin.noReports')}</p>
        </div>
      </Panel>
    )
  }

  const actionBtn =
    'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-[14px] font-medium transition-colors'

  return (
    <div className="grid gap-4">
      {error && <p className="text-[14px] text-red-600">{error}</p>}

      {reports.map((r) => {
        const key = (action) => `${r.id}:${action}`
        const isJob = r.kind === 'job'

        return (
          <Panel key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-display text-[19px] text-ink">{r.target}</h3>
                  <StatusPill status={r.severity}>{t(`severity.${r.severity}`)}</StatusPill>
                  <StatusPill status="new">{t('admin.open')}</StatusPill>
                </div>
                <p className="mt-2.5 text-[14.5px] text-ink-600">{t(`reportReason.${r.reason}`)}</p>
                <p className="mt-1.5 text-[13px] text-ink-400">
                  {t(`dash.${isJob ? 'job' : 'profile'}`)} · {t('admin.reportedOn')} {d(r.date)}
                </p>

                {/* Accès direct à la cible : juger sans la voir n'a pas de sens. */}
                {isJob && r.jobId && (
                  <Link
                    to={`/offres/${r.jobId}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] text-ink-600 transition-colors hover:text-vert-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('dash.inspect')}
                  </Link>
                )}
                {!isJob && r.workerId && (
                  <Link
                    to={`/travailleurs/${r.workerId}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] text-ink-600 transition-colors hover:text-vert-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('dash.inspect')}
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {isJob && r.jobId && (
                  <button
                    onClick={() => setConfirming(confirming === key('delete') ? null : key('delete'))}
                    className={`${actionBtn} border-sand-300 bg-white text-ink-600 hover:border-ocre-500 hover:text-ocre-700`}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('admin.deleteReportedJob')}
                  </button>
                )}
                {!isJob && r.workerId && !r.workerSuspended && (
                  <button
                    onClick={() => setConfirming(confirming === key('suspend') ? null : key('suspend'))}
                    className={`${actionBtn} border-sand-300 bg-white text-ink-600 hover:border-ocre-500 hover:text-ocre-700`}
                  >
                    <ShieldOff className="h-4 w-4" />
                    {t('admin.suspendReported')}
                  </button>
                )}
                <button
                  onClick={() => run(() => closeReport(r.id))}
                  className={`${actionBtn} border-vert-100 bg-vert-50 text-vert-700 hover:bg-vert-700 hover:text-sand-50`}
                >
                  <Check className="h-4 w-4" />
                  {t('admin.resolveReport')}
                </button>
              </div>
            </div>

            {confirming === key('delete') && (
              <ConfirmRow
                label={t('admin.deleteReportedJobConfirm')}
                confirmLabel={t('dash.confirmDelete')}
                onConfirm={() => run(() => deleteReportedJob(r.id, r.jobId))}
                onCancel={() => setConfirming(null)}
                cancelLabel={t('dash.cancel')}
              />
            )}
            {confirming === key('suspend') && (
              <ConfirmRow
                label={t('admin.suspendReportedConfirm')}
                confirmLabel={t('admin.suspend')}
                onConfirm={() => run(() => suspendReportedWorker(r.id, r.workerId))}
                onCancel={() => setConfirming(null)}
                cancelLabel={t('dash.cancel')}
              />
            )}
          </Panel>
        )
      })}
    </div>
  )
}

function ConfirmRow({ label, confirmLabel, cancelLabel, onConfirm, onCancel }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-s-2 border-ocre-500 bg-ocre-100/50 px-4 py-3">
      <p className="flex-1 text-[13.5px] text-ocre-700">{label}</p>
      <button
        onClick={onConfirm}
        className="h-8 rounded-lg bg-ocre-700 px-3 text-[13.5px] font-medium text-white transition-colors hover:bg-ocre-500"
      >
        {confirmLabel}
      </button>
      <button
        onClick={onCancel}
        className="h-8 rounded-lg border border-sand-300 bg-white px-3 text-[13.5px] text-ink-600 transition-colors hover:text-ink"
      >
        {cancelLabel}
      </button>
    </div>
  )
}
