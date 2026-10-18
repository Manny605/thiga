import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Flag, Handshake, TrendingDown, TrendingUp, Users2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { fetchAdminStats } from '../../../lib/admin'
import StatCard from '../../../components/dashboard/StatCard'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import Sparkline from '../../../components/dashboard/Sparkline'
import Avatar from '../../../components/ui/Avatar'
import { useAdmin } from './AdminLayout'

export default function Overview() {
  const { t, n, d } = useI18n()
  const { queue, reports, users } = useAdmin()
  const [stats, setStats] = useState({ users: 0, matches: 0 })

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(() => setStats({ users: 0, matches: 0 }))
  }, [])

  const pendingUsers = users.filter((u) => u.status === 'pending')
  const latest = [...users].sort((a, b) => b.joined.localeCompare(a.joined)).slice(0, 5)

  const signups = useMemo(() => {
    const days = []
    const today = new Date()
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    const counts = new Map(days.map((d) => [d, 0]))
    for (const u of users) {
      if (counts.has(u.joined)) counts.set(u.joined, counts.get(u.joined) + 1)
    }
    const series = days.map((d) => counts.get(d))
    const recent = series.slice(6).reduce((s, x) => s + x, 0)
    const previous = series.slice(0, 6).reduce((s, x) => s + x, 0)
    return {
      series,
      total: recent + previous,
      trend: previous === 0 ? null : Math.round(((recent - previous) / previous) * 100),
    }
  }, [users])

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users2} label={t('dash.totalUsers')} value={n(stats.users)} delay={0} />
        <StatCard icon={Clock} label={t('dash.pendingReview')} value={n(queue.length)} delay={70} />
        <StatCard icon={Flag} label={t('dash.openReports')} value={n(reports.length)} delay={140} />
        <StatCard icon={Handshake} label={t('dash.matches')} value={n(stats.matches)} delay={210} />
      </div>

      <Panel title={t('admin.signupsTrend')} className="mt-6">
        <div className="flex items-end gap-6">
          <div>
            <p className="font-display text-[34px] leading-none text-ink tabular-nums">
              {n(signups.total)}
            </p>
            {signups.trend === null ? (
              <p className="mt-2 text-[13px] text-ink-400">{t('admin.noTrend')}</p>
            ) : (
              <p
                className={`mt-2 flex items-center gap-1.5 text-[13px] ${
                  signups.trend < 0 ? 'text-ocre-700' : 'text-vert-600'
                }`}
              >
                {signups.trend < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5" />
                )}
                {signups.trend > 0 ? '+' : ''}{n(signups.trend)} %
              </p>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Sparkline data={signups.series} />
          </div>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <Panel
          title={t('admin.pendingUsers')}
          bodyClass=""
          className="xl:col-span-6"
          action={
            <Link to="/admin/utilisateurs" className="flex items-center gap-1.5 text-[13.5px] font-medium text-vert-700 hover:underline">
              {t('dash.seeAll')}
              <ArrowRight className="flip-rtl h-3.5 w-3.5" />
            </Link>
          }
        >
          {pendingUsers.length === 0 ? (
            <p className="px-6 py-10 text-center text-[14.5px] text-ink-400">{t('dash.noQueue')}</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {pendingUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3.5 px-6 py-4 transition-colors hover:bg-sand-50">
                  <Avatar name={u.name} src={u.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium text-ink">{u.name}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-400">
                      {t(`admin.${u.role}`)}{u.city ? ` · ${t(`cities.${u.city}`)}` : ''}
                    </p>
                  </div>
                  <StatusPill status="pending">{t('admin.pending')}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t('admin.lastActivity')} bodyClass="" className="xl:col-span-6">
          <ul className="divide-y divide-sand-200">
            {latest.map((u) => (
              <li key={u.id} className="flex items-center gap-3.5 px-6 py-4 transition-colors hover:bg-sand-50">
                <Avatar name={u.name} src={u.avatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-medium text-ink">{u.name}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-400">
                    {t('admin.joined')} {d(u.joined)}
                  </p>
                </div>
                <StatusPill status={u.status === 'active' ? 'online' : u.status === 'pending' ? 'pending' : 'closed'}>
                  {t(`admin.${u.status}`)}
                </StatusPill>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}
