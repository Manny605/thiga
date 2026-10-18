import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ExternalLink, FileText, ShieldCheck, Tags, X } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { getVerificationDocumentUrl } from '../../../lib/admin'
import Panel from '../../../components/dashboard/Panel'
import { Select, Textarea } from '../../../components/ui/Field'

const REASONS = ['blurry', 'expired', 'mismatch', 'wrong_document', 'incomplete', 'other']
import { useAdmin } from './AdminLayout'

export default function Moderation({ kind }) {
  const { t, d } = useI18n()
  const { queue, resolveQueue } = useAdmin()
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  const isJobs = kind === 'job'
  const list = queue.filter((q) => q.kind === kind && (isJobs || !role || q.role === role))

  const resolve = async (id, decision, detail) => {
    setError('')
    setBusyId(id)
    try {
      await resolveQueue(id, decision, detail)
      setRejecting(null)
    } catch {
      setError(t('dash.actionError'))
    } finally {
      setBusyId(null)
    }
  }

  const askReject = (id) => {
    setRejecting(id)
    setReason('')
    setNote('')
  }

  const viewDocument = async (path) => {
    setError('')
    try {
      window.open(await getVerificationDocumentUrl(path), '_blank', 'noopener')
    } catch {
      setError(t('admin.documentError'))
    }
  }

  return (
    <>
      {error && <p className="mb-6 text-[14px] text-red-600">{error}</p>}

      <Panel
        title={t(isJobs ? 'dash.jobsReview' : 'dash.verifications')}
        bodyClass=""
        action={
          !isJobs && (
            <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-44" aria-label={t('admin.role')}>
              <option value="">{t('admin.allRoles')}</option>
              <option value="worker">{t('admin.worker')}</option>
              <option value="employer">{t('admin.employer')}</option>
            </Select>
          )
        }
      >
        {list.length === 0 ? (
          <p className="px-6 py-16 text-center text-[14.5px] text-ink-400">
            {t(isJobs ? 'admin.noJobsQueue' : 'admin.noVerifQueue')}
          </p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {list.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-4 px-6 py-4 transition-colors hover:bg-sand-50">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sand-100 text-ink-600">
                  {isJobs ? <Tags className="h-4 w-4" strokeWidth={1.5} /> : <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-ink">{q.label}</p>
                  <p className="mt-1 truncate text-[13px] text-ink-400">
                    {isJobs ? q.by : [t(`admin.${q.role}`), q.by && t(`cities.${q.by}`)].filter(Boolean).join(' · ')}
                    {' · '}{d(q.date)}
                  </p>
                </div>

                {isJobs ? (
                  <Link
                    to={`/offres/${q.ref}`}
                    className="flex items-center gap-1.5 text-[13.5px] text-ink-600 transition-colors hover:text-vert-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('dash.inspect')}
                  </Link>
                ) : (
                  <button
                    onClick={() => viewDocument(q.documentPath)}
                    className="flex items-center gap-1.5 text-[13.5px] text-ink-600 transition-colors hover:text-vert-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {t('admin.viewDocument')}
                  </button>
                )}

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => resolve(q.id, 'approve')}
                    disabled={busyId === q.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-vert-100 bg-vert-50 px-3 text-[13.5px] font-medium text-vert-700 transition-colors hover:bg-vert-700 hover:text-sand-50 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {t(isJobs ? 'admin.publish' : 'admin.verifyIdentity')}
                  </button>
                  <button
                    onClick={() => (isJobs ? resolve(q.id, 'reject') : askReject(q.id))}
                    disabled={busyId === q.id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3 text-[13.5px] font-medium text-ink-600 transition-colors hover:border-ocre-500 hover:text-ocre-700 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    {t('dash.reject')}
                  </button>
                </div>

                {rejecting === q.id && (
                  <form
                    className="w-full rounded-xl border border-ocre-300/70 bg-ocre-50 p-4"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (reason) resolve(q.id, 'reject', { reason, note })
                    }}
                  >
                    <p className="text-[14px] font-medium text-ink-800">{t('admin.rejectReason')}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup">
                      {REASONS.map((r) => (
                        <label
                          key={r}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-[14px] transition-colors ${
                            reason === r ? 'border-ocre-500 bg-white text-ink' : 'border-sand-300 bg-white/70 text-ink-600 hover:border-sand-400'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`reason-${q.id}`}
                            value={r}
                            checked={reason === r}
                            onChange={() => setReason(r)}
                            className="h-4 w-4 accent-ocre-700"
                          />
                          {t(`verification.reasons.${r}`)}
                        </label>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Textarea
                        id={`reject-note-${q.id}`}
                        label={t('admin.rejectNote')}
                        rows={2}
                        maxLength={500}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t('admin.rejectNotePlaceholder')}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={!reason || busyId === q.id}
                        className="h-9 rounded-lg bg-ocre-700 px-3.5 text-[13.5px] font-medium text-white transition-colors hover:bg-ocre-500 disabled:opacity-40"
                      >
                        {busyId === q.id ? '…' : t('admin.confirmReject')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejecting(null)}
                        className="h-9 rounded-lg border border-sand-300 bg-white px-3.5 text-[13.5px] text-ink-600 transition-colors hover:text-ink"
                      >
                        {t('dash.cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}
