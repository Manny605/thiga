import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, FileText, Send, Star } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import { fetchOnlineJobs } from '../../../lib/jobs'
import StatCard from '../../../components/dashboard/StatCard'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { useWorkerDash } from './WorkerLayout'

export default function Overview() {
  const { t, n, d } = useI18n()
  const { profile } = useAuth()
  const { applications, workerProfile } = useWorkerDash()
  const [suggested, setSuggested] = useState([])

  useEffect(() => {
    if (!workerProfile) return
    fetchOnlineJobs()
      .then((jobs) => {
        setSuggested(
          jobs.filter((j) => j.trade === workerProfile.trade || j.city === workerProfile.city).slice(0, 3)
        )
      })
      .catch(() => setSuggested([]))
  }, [workerProfile?.trade, workerProfile?.city])

  const checklist = workerProfile
    ? [
        [t('avatar.title'), !!profile?.avatar_path, '/tableau-de-bord/travailleur/parametres'],
        [t('dash.bioLabel'), !!workerProfile.bio, '/tableau-de-bord/travailleur/profil'],
        [t('common.skills'), workerProfile.skills.length > 0, '/tableau-de-bord/travailleur/profil'],
        [t('common.languages'), workerProfile.langs.length > 0, '/tableau-de-bord/travailleur/profil'],
        [t('common.rate'), !!workerProfile.rate, '/tableau-de-bord/travailleur/profil'],
        [t('cv.title'), !!workerProfile.cvPath, '/tableau-de-bord/travailleur/profil'],
        [t('verification.title'), !!workerProfile.verified, '/tableau-de-bord/travailleur/profil'],
      ]
    : []
  const completion = checklist.length
    ? Math.round((checklist.filter(([, done]) => done).length / checklist.length) * 100)
    : 0

  const recentApps = applications.slice(0, 5)

  return (
    <>
      <h2 className="-mt-4 mb-6 font-display text-[20px] text-ink">
        {t('dash.greeting')}, {(profile?.full_name || '').split(' ')[0]}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Send} label={t('dash.myApps')} value={n(applications.length)} delay={0} />
        <StatCard icon={Star} label={t('workers.references')} value={n(workerProfile?.refs ?? 0)} delay={70} />
        <StatCard icon={Clock} label={t('dash.yearsLabel')} value={n(workerProfile?.years ?? 0)} delay={140} />
        <StatCard icon={FileText} label={t('dash.completion')} value={`${n(completion)} %`} delay={210} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <Panel title={t('dash.completion')} className="xl:col-span-5">
          <div className="flex items-end justify-between">
            <p className="font-display text-[38px] leading-none text-vert-700 tabular-nums">
              {n(completion)} %
            </p>
            {workerProfile?.verified && <Badge tone="vert">{t('common.verified')}</Badge>}
          </div>

          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-sand-200">
            <div
              className="h-full rounded-full bg-vert-700 transition-[width] duration-1000 ease-out"
              style={{ width: `${completion}%` }}
            />
          </div>

          {completion < 100 && (
            <p className="mt-4 text-[14px] leading-relaxed text-ink-600">{t('dash.completionHint')}</p>
          )}

          <ul className="mt-5 space-y-2.5 border-t border-sand-200/70 pt-5">
            {checklist.map(([label, done, to]) => (
              <li key={label} className="flex items-center gap-2.5 text-[14px]">
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${
                    done ? 'bg-vert-700 text-sand-50' : 'border border-sand-400 text-transparent'
                  }`}
                >
                  ✓
                </span>
                {done ? (
                  <span className="text-ink-600">{label}</span>
                ) : (
                  <Link to={to} className="text-ink-400 underline decoration-sand-300 underline-offset-4 hover:text-vert-700 hover:decoration-vert-700">
                    {label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <Button size="sm" variant="outline" className="mt-6 w-full" to="/tableau-de-bord/travailleur/profil">
            {t('dash.completeProfile')}
          </Button>
        </Panel>

        <Panel
          title={t('dash.myApps')}
          bodyClass=""
          className="xl:col-span-7"
          action={
            <Link to="/tableau-de-bord/travailleur/candidatures" className="text-[13.5px] text-vert-700 hover:underline">
              {t('dash.seeAll')}
            </Link>
          }
        >
          {recentApps.length === 0 ? (
            <p className="px-6 py-10 text-center text-[14.5px] text-ink-400">{t('common.empty')}</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {recentApps.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-sand-50">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/offres/${a.jobId}`}
                      className="block truncate text-[15px] font-medium text-ink transition-colors hover:text-vert-700"
                    >
                      {a.jobTitle}
                    </Link>
                    <p className="mt-1 truncate text-[13px] text-ink-400">
                      {a.employer} · {d(a.date)}
                    </p>
                  </div>
                  <StatusPill status={a.status}>{t(`appStatus.${a.status}`)}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title={t('dash.recommended')}
        bodyClass=""
        className="mt-6"
        action={
          <Link to="/offres" className="text-[13.5px] text-vert-700 hover:underline">
            {t('dash.seeAll')}
          </Link>
        }
      >
        {suggested.length === 0 ? (
          <p className="px-6 py-10 text-center text-[14.5px] text-ink-400">{t('common.empty')}</p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {suggested.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 transition-colors hover:bg-sand-50">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/offres/${j.id}`}
                    className="block truncate text-[15px] font-medium text-ink transition-colors hover:text-vert-700"
                  >
                    {j.title}
                  </Link>
                  <p className="mt-1 text-[13px] text-ink-400">
                    {t(`cities.${j.city}`)}
                    {j.contract && <> · {t(`contracts.${j.contract}`)}</>}
                  </p>
                </div>
                <p className="font-display text-[16px] text-vert-700 tabular-nums">
                  {n(j.salary)} <span className="text-[12px] text-ink-400">MRU</span>
                </p>
                <Button size="sm" to={`/offres/${j.id}`} variant="outline">
                  {t('common.apply')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}
