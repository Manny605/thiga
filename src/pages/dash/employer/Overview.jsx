import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Clock, FileText, Users2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import { useTrades } from '../../../trades/TradesProvider'
import { fetchMyVerification, submitVerification } from '../../../lib/verification'
import StatCard from '../../../components/dashboard/StatCard'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import Avatar from '../../../components/ui/Avatar'
import Button from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Field'
import { useEmployerDash } from './EmployerLayout'

const VERIFICATION_TONE = { pending: 'pending', approved: 'online', rejected: 'closed' }

/** Statut de vérification d'identité + formulaire de soumission du document. */
function VerificationPanel({ employerId }) {
  const { t } = useI18n()
  const [verification, setVerification] = useState(undefined) // undefined = chargement, null = aucune demande
  const [file, setFile] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // `null` en cas d'échec : le panneau propose alors d'envoyer un document,
  // plutôt que de rester bloqué sur un chargement muet.
  const load = () =>
    fetchMyVerification(employerId)
      .then(setVerification)
      .catch(() => setVerification(null))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employerId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setSubmitting(true)
    setError('')
    try {
      await submitVerification(employerId, file, note)
      setFile(null)
      setNote('')
      await load()
    } catch {
      setError(t('verification.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (verification === undefined) return null

  const showForm = !verification || verification.status === 'rejected'

  return (
    <Panel title={t('verification.title')} className="mb-6">
      <p className="text-[13.5px] text-ink-600">{t('verification.lede')}</p>

      {verification && (
        <div className="mt-4">
          <StatusPill status={VERIFICATION_TONE[verification.status]}>
            {t(`verification.${verification.status}`)}
          </StatusPill>
        </div>
      )}
      {!verification && (
        <p className="mt-4 text-[13px] text-ink-400">{t('verification.none')}</p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-800">
              {t('verification.uploadLabel')}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-[13px] text-ink-600"
              required
            />
          </label>
          <Input
            label={t('verification.noteLabel')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <p className="text-[13px] text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={submitting || !file}>
            {submitting ? t('verification.submitting') : t('verification.submit')}
          </Button>
        </form>
      )}
    </Panel>
  )
}

export default function Overview() {
  const { t, n, d } = useI18n()
  const { tradeLabel } = useTrades()
  const { user, profile } = useAuth()
  const { jobs, applicants } = useEmployerDash()

  const active = jobs.filter((j) => j.status === 'online').length
  const pending = jobs.filter((j) => j.status === 'pending').length
  const totalApps = jobs.reduce((s, j) => s + j.appsCount, 0)

  const recentJobs = jobs.slice(0, 5)
  const recentApplicants = applicants.slice(0, 5)

  return (
    <>
      <h2 className="-mt-4 mb-6 font-display text-[20px] text-ink">
        {t('dash.greeting')}, {profile?.full_name || ''}
      </h2>

      {user && <VerificationPanel employerId={user.id} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label={t('dash.active')} value={n(active)} delay={0} />
        <StatCard icon={Clock} label={t('dash.pendingReview')} value={n(pending)} delay={70} />
        <StatCard icon={Users2} label={t('dash.apps')} value={n(totalApps)} delay={140} />
        <StatCard icon={Briefcase} label={t('dash.totalJobs')} value={n(jobs.length)} delay={210} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        {/* Annonces */}
        <Panel
          title={t('dash.myJobs')}
          bodyClass=""
          className="xl:col-span-7"
          action={
            <Link to="/tableau-de-bord/employeur/annonces" className="text-[12.5px] text-vert-700 hover:underline">
              {t('dash.seeAll')}
            </Link>
          }
        >
          {recentJobs.length === 0 ? (
            <p className="px-6 py-10 text-center text-[13.5px] text-ink-400">{t('common.empty')}</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {recentJobs.map((j) => (
                <li key={j.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-sand-50">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/offres/${j.id}`}
                      className="block truncate text-[14px] font-medium text-ink transition-colors hover:text-vert-700"
                    >
                      {j.title}
                    </Link>
                    <p className="mt-1 text-[12px] text-ink-400">
                      {t(`cities.${j.city}`)} · {n(j.appsCount)} {t('dash.apps').toLowerCase()}
                    </p>
                  </div>
                  <StatusPill status={j.status}>{t(`jobStatus.${j.status}`)}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Candidatures reçues */}
        <Panel
          title={t('dash.applicants')}
          bodyClass=""
          className="xl:col-span-5"
          action={
            <Link to="/tableau-de-bord/employeur/candidatures" className="text-[12.5px] text-vert-700 hover:underline">
              {t('dash.seeAll')}
            </Link>
          }
        >
          {recentApplicants.length === 0 ? (
            <p className="px-6 py-10 text-center text-[13.5px] text-ink-400">{t('common.empty')}</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {recentApplicants.map((a) => (
                <li key={a.id} className="flex items-center gap-3.5 px-6 py-4 transition-colors hover:bg-sand-50">
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
                      {d(a.date)}
                    </p>
                  </div>
                  <StatusPill status={a.status}>{t(`appStatus.${a.status}`)}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
