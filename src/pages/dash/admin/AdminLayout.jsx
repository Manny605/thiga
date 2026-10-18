import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { ClipboardCheck, Flag, Inbox, KeyRound, LayoutGrid, Settings, ShieldCheck, Tags, Users2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import {
  fetchUsers, setUserStatus, setUserVerified, deleteUserAccount,
  fetchModerationQueue, resolveJob, resolveVerification,
  fetchReports, closeReports as closeReportsRequest, fetchResetRequests, fetchContactMessages,
} from '../../../lib/admin'
import DashShell from '../../../components/dashboard/DashShell'
import { avatarUrl, removeAvatar } from '../../../lib/avatar'

export const ADMIN_NAV = [
  { to: '/admin', end: true, icon: LayoutGrid, label: 'dash.overview', lede: 'admin.overviewLede' },
  { to: '/admin/utilisateurs', icon: Users2, label: 'dash.users', lede: 'admin.usersLede' },
  { to: '/admin/annonces', icon: ClipboardCheck, label: 'dash.jobsReview', lede: 'admin.jobsReviewLede', queue: 'job' },
  { to: '/admin/verifications', icon: ShieldCheck, label: 'dash.verifications', lede: 'admin.verificationsLede', queue: 'profile' },
  { to: '/admin/signalements', icon: Flag, label: 'dash.reports', lede: 'admin.reportsLede' },
  { to: '/admin/acces', icon: KeyRound, label: 'dash.access', lede: 'admin.accessModuleLede' },
  { to: '/admin/messages', icon: Inbox, label: 'dash.messages', lede: 'admin.messagesLede' },
  { to: '/admin/categories', icon: Tags, label: 'dash.categories', lede: 'admin.categoriesLede' },
  { to: '/admin/parametres', icon: Settings, label: 'dash.settings', lede: 'admin.settingsLede' },
]

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
  const [resetRequests, setResetRequests] = useState([])
  const [contactMessages, setContactMessages] = useState([])
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    try {
      const [q, r, u, a, m] = await Promise.all([
        fetchModerationQueue(), fetchReports(), fetchUsers(), fetchResetRequests(), fetchContactMessages(),
      ])
      setQueue(q)
      setReports(r)
      setUsers(u)
      setResetRequests(a)
      setContactMessages(m)
      setLoadError('')
    } catch {
      setLoadError(t('dash.loadError'))
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const ctx = useMemo(
    () => ({
      queue,
      reports,
      users,
      resetRequests,
      contactMessages,
      reload: load,

      dropResetRequest: (id) => setResetRequests((list) => list.filter((x) => x.id !== id)),

      dropContactMessage: (id) => setContactMessages((list) => list.filter((x) => x.id !== id)),

      resolveQueue: async (id, decision, detail) => {
        const item = queue.find((x) => x.id === id)
        if (!item) return
        if (item.kind === 'job') {
          await resolveJob(item.ref, decision)
        } else {
          await resolveVerification(item.ref, item.profileId, item.role, decision, detail)
        }
        setQueue((q) => q.filter((x) => x.id !== id))
        load()
      },

      resolveReports: async (ids, action, { jobId, workerId, note } = {}) => {
        if (action === 'retire') await resolveJob(jobId, 'reject')
        if (action === 'suspend') await setUserStatus(workerId, 'suspended')
        const resolution = { retire: 'content_removed', suspend: 'account_suspended' }[action] || 'dismissed'
        await closeReportsRequest(ids, { resolution, note })
        setReports((r) => r.filter((x) => !ids.includes(x.id)))
        if (action === 'suspend') {
          setUsers((list) => list.map((x) => (x.id === workerId ? { ...x, status: 'suspended' } : x)))
        }
      },

      patchUser: async (id, patch) => {
        const u = users.find((x) => x.id === id)
        if (!u) return
        if ('verified' in patch) await setUserVerified(id, u.role, patch.verified)
        if ('status' in patch) await setUserStatus(id, patch.status)
        if ('avatar' in patch && patch.avatar === null) await removeAvatar(id, u.avatarPath)
        const local = 'avatar' in patch ? { ...patch, avatarPath: null } : patch
        setUsers((list) => list.map((x) => (x.id === id ? { ...x, ...local } : x)))
      },

      removeUser: async (id) => {
        await deleteUserAccount(id)
        setUsers((list) => list.filter((x) => x.id !== id))
        load()
      },
    }),
    [queue, reports, users, resetRequests, contactMessages, load]
  )

  const nav = ADMIN_NAV.map((item) => ({
    ...item,
    count:
      item.queue
        ? queue.filter((q) => q.kind === item.queue).length
        : item.to === '/admin/signalements'
        ? reports.length
        : item.to === '/admin/acces'
        ? resetRequests.length
        : item.to === '/admin/messages'
        ? contactMessages.length
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
      to: q.kind === 'job' ? '/admin/annonces' : '/admin/verifications',
    })),
    ...resetRequests.map((r) => ({
      id: `reset:${r.id}`,
      title: t('notif.resetRequest'),
      body: r.name || r.phone,
      date: r.date,
      to: '/admin/acces',
    })),
    ...contactMessages.map((m) => ({
      id: `contact:${m.id}`,
      title: t('notif.contactMessage'),
      body: `${m.name} · ${t(`contact.subjects.${m.subject}`)}`,
      date: m.date,
      to: '/admin/messages',
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
      avatar={avatarUrl(profile?.avatar_path)}
      nav={nav}
      title={t(current.label)}
      notifications={notifications}
    >
      <p className="-mt-2 mb-8 text-[14.5px] text-ink-600">{t(current.lede)}</p>
      {loadError && (
        <p className="mb-6 rounded-xl border border-ocre-300 bg-ocre-100 px-4 py-3 text-[14px] text-ocre-700">{loadError}</p>
      )}
      <Outlet context={ctx} />
    </DashShell>
  )
}
