import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { LayoutGrid, Send, Settings, User } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import { fetchMyApplications, fetchMyWorkerProfile, withdrawApplication } from '../../../lib/workerDash'
import DashShell from '../../../components/dashboard/DashShell'
import { avatarUrl } from '../../../lib/avatar'

export const WORKER_NAV = [
  { to: '/tableau-de-bord/travailleur', end: true, icon: LayoutGrid, label: 'dash.overview' },
  { to: '/tableau-de-bord/travailleur/profil', icon: User, label: 'dash.myProfile', lede: 'dash.myProfileLede' },
  { to: '/tableau-de-bord/travailleur/candidatures', icon: Send, label: 'dash.myApps', lede: 'dash.myAppsLede' },
  { to: '/tableau-de-bord/travailleur/parametres', icon: Settings, label: 'dash.settings', lede: 'dash.settingsLede' },
]

export function useWorkerDash() {
  return useOutletContext()
}

export default function WorkerLayout() {
  const { t } = useI18n()
  const { user, profile } = useAuth()
  const { pathname } = useLocation()

  const [applications, setApplications] = useState([])
  const [workerProfile, setWorkerProfile] = useState(null)
  const [loadError, setLoadError] = useState('')

  const userId = user?.id

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const [apps, wp] = await Promise.all([fetchMyApplications(userId), fetchMyWorkerProfile(userId)])
      setApplications(apps)
      setWorkerProfile(wp)
      setLoadError('')
    } catch {
      setLoadError(t('dash.loadError'))
    }
  }, [userId, t])

  useEffect(() => {
    load()
  }, [load])

  const ctx = useMemo(
    () => ({
      applications,
      workerProfile,
      reload: load,
      withdraw: async (applicationId) => {
        await withdrawApplication(applicationId)
        await load()
      },
    }),
    [applications, workerProfile, load]
  )

  const nav = WORKER_NAV.map((item) => (item.label === 'dash.myApps' ? { ...item, count: applications.length } : item))

  const current = [...WORKER_NAV].reverse().find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to))) || WORKER_NAV[0]

  const notifications = applications
    .filter((a) => a.status === 'shortlisted' || a.status === 'hired' || a.status === 'rejected')
    .map((a) => ({
      id: `app:${a.id}:${a.status}`,
      title: t({ shortlisted: 'notif.appShortlisted', hired: 'notif.appHired', rejected: 'notif.appRejected' }[a.status]),
      body: `${a.jobTitle} · ${a.employer}`,
      date: a.date,
      to: '/tableau-de-bord/travailleur/candidatures',
    }))

  return (
    <DashShell
      space={t('dash.worker')}
      user={profile?.full_name || ''}
      avatar={avatarUrl(profile?.avatar_path)}
      nav={nav}
      title={t(current.label)}
      notifications={notifications}
    >
      {current.lede && <p className="-mt-2 mb-8 text-[14.5px] text-ink-600">{t(current.lede)}</p>}
      {loadError && (
        <p className="mb-6 rounded-xl border border-ocre-300 bg-ocre-100 px-4 py-3 text-[14px] text-ocre-700">{loadError}</p>
      )}
      <Outlet context={ctx} />
    </DashShell>
  )
}
