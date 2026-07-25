import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { Flag, LayoutGrid, ShieldAlert, Tags, Users2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import {
  fetchUsers, setUserStatus, setUserVerified,
  fetchModerationQueue, resolveJob, resolveVerification,
  fetchReports, closeReport as closeReportRequest, deleteJob,
} from '../../../lib/admin'
import DashShell from '../../../components/dashboard/DashShell'

export const ADMIN_NAV = [
  { to: '/admin', end: true, icon: LayoutGrid, label: 'dash.overview', lede: 'admin.overviewLede' },
  { to: '/admin/utilisateurs', icon: Users2, label: 'dash.users', lede: 'admin.usersLede' },
  { to: '/admin/moderation', icon: ShieldAlert, label: 'dash.moderation', lede: 'admin.moderationLede' },
  { to: '/admin/signalements', icon: Flag, label: 'dash.reports', lede: 'admin.reportsLede' },
  { to: '/admin/categories', icon: Tags, label: 'dash.categories', lede: 'admin.categoriesLede' },
]

/** Accès à l'état partagé de l'espace admin depuis n'importe quelle sous-page. */
export function useAdmin() {
  return useOutletContext()
}

export default function AdminLayout() {
  const { t } = useI18n()
  const { profile } = useAuth()
  const { pathname } = useLocation()

  const [queue, setQueue] = useState([])
  const [reports, setReports] = useState([])
  const [users, setUsers] = useState([])
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    try {
      const [q, r, u] = await Promise.all([fetchModerationQueue(), fetchReports(), fetchUsers()])
      setQueue(q)
      setReports(r)
      setUsers(u)
      setLoadError('')
    } catch {
      setLoadError(t('dash.loadError'))
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  // Le catalogue des métiers vit dans <TradesProvider> : la page Catégories
  // le lit et le recharge directement, sans passer par cet état partagé.
  const ctx = useMemo(
    () => ({
      queue,
      reports,
      users,
      reload: load,

      resolveQueue: async (id, decision) => {
        const item = queue.find((x) => x.id === id)
        if (!item) return
        if (item.kind === 'job') {
          await resolveJob(item.ref, decision)
        } else {
          await resolveVerification(item.ref, item.employerId, decision)
        }
        setQueue((q) => q.filter((x) => x.id !== id))
        // Le statut d'une annonce ou d'un compte vient de changer : la liste
        // des utilisateurs affichée ailleurs doit suivre.
        load()
      },

      closeReport: async (id) => {
        await closeReportRequest(id)
        setReports((r) => r.filter((x) => x.id !== id))
      },

      /** Supprime l'annonce signalée ; le signalement part en cascade avec elle. */
      deleteReportedJob: async (reportId, jobId) => {
        await deleteJob(jobId)
        setReports((r) => r.filter((x) => x.id !== reportId))
      },

      suspendReportedWorker: async (reportId, workerId) => {
        await setUserStatus(workerId, 'suspended')
        await closeReportRequest(reportId)
        setReports((r) => r.filter((x) => x.id !== reportId))
        setUsers((list) => list.map((x) => (x.id === workerId ? { ...x, status: 'suspended' } : x)))
      },

      patchUser: async (id, patch) => {
        const u = users.find((x) => x.id === id)
        if (!u) return
        if ('verified' in patch) await setUserVerified(id, u.role, patch.verified)
        if ('status' in patch) await setUserStatus(id, patch.status)
        setUsers((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)))
      },
    }),
    [queue, reports, users, load]
  )

  const nav = ADMIN_NAV.map((item) => ({
    ...item,
    count:
      item.to === '/admin/moderation'
        ? queue.length
        : item.to === '/admin/signalements'
        ? reports.length
        : 0,
  }))

  const current =
    [...ADMIN_NAV].reverse().find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to))) ||
    ADMIN_NAV[0]

  const notifications = [
    ...queue.map((q) => ({
      id: `queue:${q.id}`,
      title: t(q.kind === 'job' ? 'notif.queueJob' : 'notif.queueProfile'),
      body: q.label,
      date: q.date,
      to: '/admin/moderation',
    })),
    ...reports.map((r) => ({
      id: `report:${r.id}`,
      title: t('notif.report'),
      body: `${r.target} · ${t(`reportReason.${r.reason}`)}`,
      date: r.date,
      to: '/admin/signalements',
    })),
  ]

  return (
    <DashShell
      variant="admin"
      space={t('dash.admin')}
      user={profile?.full_name || ''}
      nav={nav}
      title={t(current.label)}
      notifications={notifications}
    >
      <p className="-mt-2 mb-8 text-[13.5px] text-ink-600">{t(current.lede)}</p>
      {loadError && (
        <p className="mb-6 border border-ocre-300 bg-ocre-100 px-4 py-3 text-[13px] text-ocre-700">{loadError}</p>
      )}
      <Outlet context={ctx} />
    </DashShell>
  )
}
