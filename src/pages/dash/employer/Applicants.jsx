import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Eye, FileText, Quote, X } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useTrades } from '../../../trades/TradesProvider'
import { getCvUrl } from '../../../lib/cv'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import Avatar from '../../../components/ui/Avatar'
import { Select } from '../../../components/ui/Field'
import { useEmployerDash } from './EmployerLayout'

export default function Applicants() {
  const { t, d } = useI18n()
  const { tradeLabel } = useTrades()
  const { applicants, setApplicantStatus } = useEmployerDash()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const list = status ? applicants.filter((a) => a.status === status) : applicants

  const update = async (id, next) => {
    setError('')
    try {
      await setApplicantStatus(id, next)
    } catch {
      setError(t('dash.actionError'))
    }
  }

  /** Lien signé valable 5 minutes : le CV n'est jamais exposé publiquement. */
  const openCv = async (path) => {
    setError('')
    try {
      window.open(await getCvUrl(path), '_blank', 'noopener')
    } catch {
      setError(t('cv.openError'))
    }
  }

  const iconBtn = 'grid h-8 w-8 place-items-center rounded-lg border transition-colors'

  return (
    <>
      {error && <p className="mb-6 text-[13px] text-red-600">{error}</p>}

      <Panel
        title={t('dash.applicants')}
        bodyClass=""
        action={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="">{t('admin.allStatus')}</option>
            <option value="new">{t('appStatus.new')}</option>
            <option value="seen">{t('appStatus.seen')}</option>
            <option value="shortlisted">{t('appStatus.shortlisted')}</option>
            <option value="rejected">{t('appStatus.rejected')}</option>
          </Select>
        }
      >
        {list.length === 0 ? (
          <p className="px-6 py-10 text-center text-[13.5px] text-ink-400">{t('common.empty')}</p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {list.map((a) => (
              <li key={a.id} className="px-6 py-4 transition-colors hover:bg-sand-50">
                <div className="flex items-center gap-3.5">
                  <Avatar name={a.workerName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/travailleurs/${a.workerId}`}
                      className="block truncate text-[13.5px] font-medium text-ink transition-colors hover:text-vert-700"
                    >
                      {a.workerName}
                    </Link>
                    <p className="mt-0.5 truncate text-[11.5px] text-ink-400">
                      {a.workerTrade && <>{tradeLabel(a.workerTrade)} · </>}
                      <Link to={`/offres/${a.jobId}`} className="hover:text-vert-700 hover:underline">
                        {a.jobTitle}
                      </Link>{' '}
                      · {d(a.date)}
                    </p>
                  </div>
                  <StatusPill status={a.status}>{t(`appStatus.${a.status}`)}</StatusPill>
                  <div className="flex shrink-0 gap-1.5">
                    {a.status === 'new' && (
                      <button
                        onClick={() => update(a.id, 'seen')}
                        title={t('dash.markSeen')}
                        className={`${iconBtn} border-sand-300 bg-white text-ink-400 hover:border-ink-400 hover:text-ink`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => update(a.id, 'shortlisted')}
                      title={t('dash.approve')}
                      className={`${iconBtn} border-vert-100 bg-vert-50 text-vert-700 hover:bg-vert-700 hover:text-sand-50`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => update(a.id, 'rejected')}
                      title={t('dash.reject')}
                      className={`${iconBtn} border-sand-300 bg-white text-ink-400 hover:border-ocre-500 hover:text-ocre-700`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {a.cvPath && (
                  <button
                    onClick={() => openCv(a.cvPath)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-[12.5px] text-ink-600 transition-colors hover:border-vert-200 hover:text-vert-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {t('cv.view')}
                    <span className="max-w-[14rem] truncate text-ink-400">{a.cvName}</span>
                  </button>
                )}

                {/* Le mot du candidat : saisi à la candidature, il n'était
                    affiché nulle part côté employeur. */}
                {a.message && (
                  <p className="mt-3 flex gap-2.5 border-s-2 border-sand-300 ps-3.5 text-[12.5px] leading-relaxed text-ink-600">
                    <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sand-400" />
                    {a.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}
