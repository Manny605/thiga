import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import { fetchMyReviews } from '../../../lib/reviews'
import ReviewBox from '../../../components/reviews/ReviewBox'
import { fetchContacts } from '../../../lib/contact'
import Panel from '../../../components/dashboard/Panel'
import ContactLine from '../../../components/dashboard/ContactLine'
import StatusPill from '../../../components/dashboard/StatusPill'
import { Select } from '../../../components/ui/Field'
import { useWorkerDash } from './WorkerLayout'

export default function Applications() {
  const { t, d } = useI18n()
  const { user } = useAuth()
  const { applications, withdraw } = useWorkerDash()
  const [status, setStatus] = useState('')
  const [confirmingId, setConfirmingId] = useState(null)
  const [error, setError] = useState('')

  const list = status ? applications.filter((a) => a.status === status) : applications

  const [contacts, setContacts] = useState(null)
  const shortlistedIds = applications
    .filter((a) => a.status === 'shortlisted' || a.status === 'hired')
    .map((a) => a.employerId)
    .filter(Boolean)
    .sort()
    .join(',')

  useEffect(() => {
    let active = true
    fetchContacts(shortlistedIds ? shortlistedIds.split(',') : [])
      .then((c) => { if (active) setContacts(c) })
      .catch(() => { if (active) setContacts({}) })
    return () => { active = false }
  }, [shortlistedIds])

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

  const handleWithdraw = async (id) => {
    setConfirmingId(null)
    setError('')
    try {
      await withdraw(id)
    } catch {
      setError(t('dash.actionError'))
    }
  }

  return (
    <>
      {error && <p className="mb-6 text-[14px] text-red-600">{error}</p>}

      <Panel
        title={t('dash.myApps')}
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
                <div className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/offres/${a.jobId}`}
                      className="block truncate text-[15px] font-medium text-ink transition-colors hover:text-vert-700"
                    >
                      {a.jobTitle}
                    </Link>
                    <p className="mt-1 truncate text-[13px] text-ink-400">
                      {a.employer} · {a.jobCity && <>{t(`cities.${a.jobCity}`)} · </>}
                      {d(a.date)}
                    </p>
                  </div>
                  <StatusPill status={a.status}>{t(`appStatus.${a.status}`)}</StatusPill>
                  {a.status !== 'hired' && <button
                    onClick={() => setConfirmingId(confirmingId === a.id ? null : a.id)}
                    title={t('dash.withdraw')}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sand-300 bg-white text-ink-400 transition-colors hover:border-ocre-500 hover:text-ocre-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>}
                </div>

                {(a.status === 'shortlisted' || a.status === 'hired') && contacts && (
                  <ContactLine label={t('reach.employerPhone')} phone={contacts[a.employerId]} />
                )}

                {a.status === 'hired' && user && a.employerId && (
                  <ReviewBox
                    key={myReviews[a.id]?.id || 'new'}
                    applicationId={a.id}
                    reviewerId={user.id}
                    revieweeId={a.employerId}
                    existing={myReviews[a.id]}
                    onSaved={reviewSaved}
                    prompt={t('reviews.promptEmployer')}
                  />
                )}

                {confirmingId === a.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-s-2 border-ocre-500 bg-ocre-100/50 px-4 py-3">
                    <p className="flex-1 text-[13.5px] text-ocre-700">{t('dash.withdrawConfirm')}</p>
                    <button
                      onClick={() => handleWithdraw(a.id)}
                      className="h-8 rounded-lg bg-ocre-700 px-3 text-[13.5px] font-medium text-white transition-colors hover:bg-ocre-500"
                    >
                      {t('dash.confirmWithdraw')}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="h-8 rounded-lg border border-sand-300 bg-white px-3 text-[13.5px] text-ink-600 transition-colors hover:text-ink"
                    >
                      {t('dash.cancel')}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}
