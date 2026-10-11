import { Link } from 'react-router-dom'
import { Briefcase, Clock, FileText, Users2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import { useTrades } from '../../../trades/TradesProvider'
import StatCard from '../../../components/dashboard/StatCard'
import VerificationPanel from '../../../components/dashboard/VerificationPanel'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import Avatar from '../../../components/ui/Avatar'
import { useEmployerDash } from './EmployerLayout'

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

      {user && <VerificationPanel profileId={user.id} />}

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
            <Link to="/tableau-de-bord/employeur/annonces" className="text-[13.5px] text-vert-700 hover:underline">
              {t('dash.seeAll')}
            </Link>
          }
        >
          {recentJobs.length === 0 ? (
            <p className="px-6 py-10 text-center text-[14.5px] text-ink-400">{t('common.empty')}</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {recentJobs.map((j) => (
                <li key={j.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-sand-50">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/offres/${j.id}`}
                      className="block truncate text-[15px] font-medium text-ink transition-colors hover:text-vert-700"
                    >
                      {j.title}
                    </Link>
                    <p className="mt-1 text-[13px] text-ink-400">
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
            <Link to="/tableau-de-bord/employeur/candidatures" className="text-[13.5px] text-vert-700 hover:underline">
              {t('dash.seeAll')}
            </Link>
          }
        >
          {recentApplicants.length === 0 ? (
            <p className="px-6 py-10 text-center text-[14.5px] text-ink-400">{t('common.empty')}</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {recentApplicants.map((a) => (
                <li key={a.id} className="flex items-center gap-3.5 px-6 py-4 transition-colors hover:bg-sand-50">
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
