import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Eye, FileText, Handshake, Quote, X } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import { useTrades } from '../../../trades/TradesProvider'
import { getCvUrl } from '../../../lib/cv'
import { fetchContacts } from '../../../lib/contact'
import ContactLine from '../../../components/dashboard/ContactLine'
import ReviewBox from '../../../components/reviews/ReviewBox'
import { fetchMyReviews } from '../../../lib/reviews'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import Avatar from '../../../components/ui/Avatar'
import { Select } from '../../../components/ui/Field'
import { useEmployerDash } from './EmployerLayout'

export default function Applicants() {
  const { t, d } = useI18n()
  const { tradeLabel } = useTrades()
  const { user } = useAuth()
  const { applicants, setApplicantStatus } = useEmployerDash()
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const list = status ? applicants.filter((a) => a.status === status) : applicants

  // Numéros de l'autre partie, pour les seules candidatures présélectionnées :
  // la base n'en livre pas d'autres. `null` tant que la lecture n'a pas abouti.
  const [contacts, setContacts] = useState(null)
  const shortlistedIds = applicants
    .filter((a) => a.status === 'shortlisted' || a.status === 'hired')
    .map((a) => a.workerId)
    .sort()
    .join(',')

  useEffect(() => {
    let active = true
    fetchContacts(shortlistedIds ? shortlistedIds.split(',') : [])
      .then((c) => { if (active) setContacts(c) })
      .catch(() => { if (active) setContacts({}) })
    return () => { active = false }
  }, [shortlistedIds])

  // Avis déjà laissés, pour afficher le rappel plutôt que le formulaire.
  const [myReviews, setMyReviews] = useState({})
  useEffect(() => {
    if (!user) return undefined
    let active = true
    fetchMyReviews(user.id)
      .then((r) => { if (active) setMyReviews(r) })
      .catch(() => {})
    return () => { active = false }
  }, [user])
  const reviewSaved = (r) => setMyReviews((m) => ({ ...m, [r.application_id]: r }))

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
      {error && <p className="mb-6 text-[14px] text-red-600">{error}</p>}

      <Panel
        title={t('dash.applicants')}
        bodyClass=""
        action={
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="">{t('admin.allStatus')}</option>
            <option value="new">{t('appStatus.new')}</option>
            <option value="seen">{t('appStatus.seen')}</option>
            <option value="shortlisted">{t('appStatus.shortlisted')}</option>
            <option value="hired">{t('appStatus.hired')}</option>
            <option value="rejected">{t('appStatus.rejected')}</option>
          </Select>
        }
      >
        {list.length === 0 ? (
          <p className="px-6 py-10 text-center text-[14.5px] text-ink-400">{t('common.empty')}</p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {list.map((a) => (
              <li key={a.id} className="px-6 py-4 transition-colors hover:bg-sand-50">
                <div className="flex items-center gap-3.5">
                  <Avatar name={a.workerName} src={a.workerAvatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/travailleurs/${a.workerId}`}
                      className="block truncate text-[14.5px] font-medium text-ink transition-colors hover:text-vert-700"
                    >
                      {a.workerName}
                    </Link>
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-400">
                      {a.workerTrade && <>{tradeLabel(a.workerTrade)} · </>}
                      <Link to={`/offres/${a.jobId}`} className="hover:text-vert-700 hover:underline">
                        {a.jobTitle}
                      </Link>{' '}
                      · {d(a.date)}
                    </p>
                  </div>
                  <StatusPill status={a.status}>{t(`appStatus.${a.status}`)}</StatusPill>
                  {a.status !== 'hired' && <div className="flex shrink-0 gap-1.5">
                    {a.status === 'shortlisted' && (
                      <button
                        onClick={() => update(a.id, 'hired')}
                        title={t('dash.markHired')}
                        className={`${iconBtn} border-vert-700 bg-vert-700 text-sand-50 hover:bg-vert-800`}
                      >
                        <Handshake className="h-3.5 w-3.5" />
                      </button>
                    )}
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
                  </div>}
                </div>

                {a.cvPath && (
                  <button
                    onClick={() => openCv(a.cvPath)}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-[13.5px] text-ink-600 transition-colors hover:border-vert-200 hover:text-vert-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {t('cv.view')}
                    <span className="max-w-[14rem] truncate text-ink-400">{a.cvName}</span>
                  </button>
                )}

                {(a.status === 'shortlisted' || a.status === 'hired') && contacts && (
                  <ContactLine label={t('reach.candidatePhone')} phone={contacts[a.workerId]} />
                )}

                {a.status === 'hired' && user && (
                  <ReviewBox
                    key={myReviews[a.id]?.id || 'new'}
                    applicationId={a.id}
                    reviewerId={user.id}
                    revieweeId={a.workerId}
                    existing={myReviews[a.id]}
                    onSaved={reviewSaved}
                    prompt={t('reviews.promptWorker')}
                  />
                )}

                {/* Le mot du candidat : saisi à la candidature, il n'était
                    affiché nulle part côté employeur. */}
                {a.message && (
                  <p className="mt-3 flex gap-2.5 border-s-2 border-sand-300 ps-3.5 text-[13.5px] leading-relaxed text-ink-600">
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
