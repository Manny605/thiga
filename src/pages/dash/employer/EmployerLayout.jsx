import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { FileText, LayoutGrid, Settings, Users2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import {
  fetchMyJobs, fetchRecentApplicants, setJobStatus, deleteJob, setApplicationStatus,
} from '../../../lib/employerDash'
import DashShell from '../../../components/dashboard/DashShell'

export const EMPLOYER_NAV = [
  { to: '/tableau-de-bord/employeur', end: true, icon: LayoutGrid, label: 'dash.overview' },
  { to: '/tableau-de-bord/employeur/annonces', icon: FileText, label: 'dash.myJobs', lede: 'dash.myJobsLede' },
  { to: '/tableau-de-bord/employeur/candidatures', icon: Users2, label: 'dash.applicants', lede: 'dash.applicantsLede' },
  { to: '/tableau-de-bord/employeur/parametres', icon: Settings, label: 'dash.settings', lede: 'dash.settingsLede' },
]

/** Accès à l'état partagé de l'espace employeur depuis n'importe quelle sous-page. */
export function useEmployerDash() {
  return useOutletContext()
}

export default function EmployerLayout() {
  const { t } = useI18n()
  const { user, profile } = useAuth()
  const { pathname } = useLocation()

  const [jobs, setJobs] = useState([])
  const [applicants, setApplicants] = useState([])
  const [loadError, setLoadError] = useState('')

  const userId = user?.id

  // Les deux requêtes étaient lancées sans `.catch` : une erreur réseau ou de
  // droits laissait les listes vides, sans rien signaler.
  const load = useCallback(async () => {
    if (!userId) return
    try {
      const [nextJobs, nextApplicants] = await Promise.all([
        fetchMyJobs(userId),
        fetchRecentApplicants(userId),
      ])
      setJobs(nextJobs)
      setApplicants(nextApplicants)
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
      jobs,
      applicants,
      reload: load,
      // Les actions relaient l'erreur : c'est la page qui décide de l'afficher.
      closeJob: async (jobId) => {
        await setJobStatus(jobId, 'closed')
        await load()
      },
      republishJob: async (jobId) => {
        await setJobStatus(jobId, 'pending')
        await load()
      },
      removeJob: async (jobId) => {
        await deleteJob(jobId)
        await load()
      },
      setApplicantStatus: async (applicationId, status) => {
        await setApplicationStatus(applicationId, status)
        await load()
      },
    }),
    [jobs, applicants, load]
  )

  const pendingJobs = jobs.filter((j) => j.status === 'pending').length
  const newApplicants = applicants.filter((a) => a.status === 'new').length

  const nav = EMPLOYER_NAV.map((item) => {
    if (item.label === 'dash.myJobs') return { ...item, count: pendingJobs }
    if (item.label === 'dash.applicants') return { ...item, count: newApplicants }
    return item
  })

  const current = [...EMPLOYER_NAV].reverse().find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to))) || EMPLOYER_NAV[0]

  const notifications = [
    ...applicants
      .filter((a) => a.status === 'new')
      .map((a) => ({
        id: `app:${a.id}:new`,
        title: t('notif.newApplicant'),
        body: `${a.workerName} · ${a.jobTitle}`,
        date: a.date,
        to: '/tableau-de-bord/employeur/candidatures',
      })),
    ...jobs
      .filter((j) => j.status === 'pending')
      .map((j) => ({
        id: `job:${j.id}:pending`,
        title: t('notif.jobPending'),
        body: j.title,
        date: j.createdAt,
        to: '/tableau-de-bord/employeur/annonces',
      })),
  ]

  return (
    <DashShell
      space={t('dash.employer')}
      user={profile?.full_name || ''}
      nav={nav}
      title={t(current.label)}
      notifications={notifications}
    >
      {current.lede && <p className="-mt-2 mb-8 text-[13.5px] text-ink-600">{t(current.lede)}</p>}
      {loadError && (
        <p className="mb-6 border border-ocre-300 bg-ocre-100 px-4 py-3 text-[13px] text-ocre-700">{loadError}</p>
      )}
      <Outlet context={ctx} />
    </DashShell>
  )
}
