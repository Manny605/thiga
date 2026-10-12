import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, BadgeCheck, Briefcase, CalendarDays, Check, FileText, MapPin,
  Paperclip, Upload, Wallet,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from '../auth/AuthProvider'
import { useTrades } from '../trades/TradesProvider'
import { supabase } from '../lib/supabaseClient'
import { fetchJobById, fetchMyApplication, fetchOnlineJobs } from '../lib/jobs'
import { isExpired } from '../lib/deadline'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import { CV_ACCEPT, describeCvProblem, fetchMyCv, uploadApplicationCv } from '../lib/cv'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import { Textarea } from '../components/ui/Field'
import JobCard from '../components/JobCard'
import ReportButton from '../components/ReportButton'
import Reveal from '../components/ui/Reveal'
import ReviewList from '../components/reviews/ReviewList'

export default function JobDetail() {
  const { id } = useParams()
  const { t, n, d } = useI18n()
  const { user, profile, isAuthenticated } = useAuth()
  const { tradeLabel } = useTrades()

  const [job, setJob] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)

  const [message, setMessage] = useState('')
  const [applyState, setApplyState] = useState('idle') // idle | sending | sent | error
  const [existingApp, setExistingApp] = useState(null)
  const [profileCv, setProfileCv] = useState(null)   // CV de référence
  const [cvFile, setCvFile] = useState(null)         // CV joint pour cette offre seulement

  useDocumentMeta(job && `${job.title} · ${t(`cities.${job.city}`)}`, job?.desc)
  const [cvError, setCvError] = useState('')

  const isWorker = isAuthenticated && profile?.role === 'worker'
  const workerId = isWorker ? user?.id : null

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchJobById(id), fetchOnlineJobs()])
      .then(([j, all]) => {
        if (cancelled) return
        setJob(j)
        setSimilar(j ? all.filter((x) => x.id !== j.id && x.trade === j.trade).slice(0, 2) : [])
      })
      .catch(() => { if (!cancelled) setJob(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  // Candidature déjà envoyée : au rechargement de la page, le formulaire
  // réapparaissait comme si de rien n'était et l'envoi butait sur l'unicité.
  useEffect(() => {
    let cancelled = false
    if (!workerId) {
      setExistingApp(null)
      return undefined
    }
    fetchMyApplication(id, workerId)
      .then((app) => { if (!cancelled) setExistingApp(app) })
      .catch(() => { if (!cancelled) setExistingApp(null) })
    fetchMyCv(workerId)
      .then((cv) => { if (!cancelled) setProfileCv(cv) })
      .catch(() => { if (!cancelled) setProfileCv(null) })
    return () => { cancelled = true }
  }, [id, workerId])

  const handleApply = async (e) => {
    e.preventDefault()
    setApplyState('sending')
    setCvError('')

    // Un fichier choisi ici ne remplace pas le CV du profil : il ne vaut que
    // pour cette candidature. Sinon, c'est le CV de référence qui part.
    let cv = profileCv
    if (cvFile) {
      try {
        cv = await uploadApplicationCv(user.id, cvFile)
      } catch {
        setCvError(t('cv.uploadError'))
        setApplyState('idle')
        return
      }
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_id: id,
        worker_id: user.id,
        message,
        cv_path: cv?.path || null,
        cv_name: cv?.name || null,
      })
      .select('id, status, created_at')
      .single()

    if (!error) {
      setExistingApp(data)
      setApplyState('sent')
      return
    }
    // 23505 : contrainte (job_id, worker_id) — une candidature existe déjà.
    if (error.code === '23505') {
      const app = await fetchMyApplication(id, user.id).catch(() => null)
      setExistingApp(app || { id: null, status: 'new' })
      setApplyState('idle')
      return
    }
    setApplyState('error')
  }

  if (loading) {
    return (
      <div className="shell py-32 text-center text-ink-400">{t('common.loading')}</div>
    )
  }

  if (!job) {
    return (
      <div className="shell py-32 text-center">
        <h1 className="text-3xl">404</h1>
        <p className="mt-3 text-ink-600">{t('common.empty')}</p>
        <Button to="/offres" className="mt-8">{t('nav.jobs')}</Button>
      </div>
    )
  }

  return (
    <>
      <div className="border-b border-sand-200/70 bg-sand-100/40">
        <div className="shell py-5">
          <Link
            to="/offres"
            className="inline-flex items-center gap-2 text-[14px] text-ink-600 transition-colors hover:text-vert-700"
          >
            <ArrowLeft className="flip-rtl h-4 w-4" />
            {t('nav.jobs')}
          </Link>
        </div>
      </div>

      <div className="shell grid gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
        {/* Contenu principal */}
        <article className="lg:col-span-7 xl:col-span-8">
          <div className="flex flex-wrap items-center gap-2 animate-fade">
            <Badge tone="vert">{tradeLabel(job.trade)}</Badge>
            {job.contract && <Badge>{t(`contracts.${job.contract}`)}</Badge>}
            {job.urgent && <Badge tone="ocre">{t('common.urgent')}</Badge>}
            {job.verified && (
              <Badge tone="solid">
                <BadgeCheck className="h-3 w-3" />
                {t('common.verified')}
              </Badge>
            )}
          </div>

          <h1 className="mt-5 animate-rise text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.08]">
            {job.title}
          </h1>

          <dl className={`mt-8 grid gap-4 ${job.deadline ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
            {[
              [Wallet, t('common.rate'), `${n(job.salary || 0)} MRU ${job.unit ? t(`common.${job.unit}`) : ''}`],
              [MapPin, t('common.city'), `${t(`cities.${job.city}`)}${job.district ? ` · ${job.district}` : ''}`],
              [CalendarDays, t('common.publishedOn'), d(job.posted)],
              ...(job.deadline ? [[CalendarDays, t('jobs.deadline'), d(job.deadline)]] : []),
            ].map(([Icon, label, value]) => (
              <div key={label} className="rounded-2xl border border-sand-200/70 bg-white p-5 shadow-card">
                <dt className="flex items-center gap-2 text-[12.5px] uppercase tracking-[0.12em] text-ink-400">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </dt>
                <dd className="mt-2 text-[15px] font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-10 text-[16px] leading-[1.75] text-ink-800">{job.desc}</p>

          {job.duties.length > 0 && (
            <section className="mt-12 border-t border-sand-200/70 pt-8">
              <h2 className="text-[22px]">{t('jobs.responsibilities')}</h2>
              <ul className="mt-5 space-y-3">
                {job.duties.map((x) => (
                  <li key={x} className="flex gap-3 text-[15.5px] leading-relaxed text-ink-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-vert-600" />
                    {x}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.reqs.length > 0 && (
            <section className="mt-10 border-t border-sand-200/70 pt-8">
              <h2 className="text-[22px]">{t('jobs.requirements')}</h2>
              <ul className="mt-5 space-y-3">
                {job.reqs.map((x) => (
                  <li key={x} className="flex gap-3 text-[15.5px] leading-relaxed text-ink-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-vert-600" />
                    {x}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10 border-t border-sand-200/70 pt-8">
            <h2 className="text-[22px]">{t('jobs.aboutEmployer')}</h2>
            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-sand-200/70 bg-white p-5 shadow-card">
              <Avatar name={job.employer} src={job.employerAvatar} size="lg" />
              <div>
                <p className="flex items-center gap-1.5 font-display text-[18px] text-ink">
                  {job.employer}
                  {job.verified && <BadgeCheck className="h-4 w-4 text-vert-600" />}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[14px] text-ink-400">
                  <Briefcase className="h-3.5 w-3.5" />
                  {job.employerType}
                </p>
              </div>
            </div>
          </section>

          {job.employerId && <ReviewList profileId={job.employerId} className="mt-10" />}
        </article>

        {/* Colonne de candidature */}
        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-28 rounded-2xl border border-sand-200/70 bg-white p-6 shadow-card">
            <h2 className="text-[21px] leading-snug">{t('jobs.applyTitle')}</h2>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-600">{t('jobs.applyLede')}</p>

            {isExpired(job.deadline) && !existingApp ? (
              <p className="mt-6 border-t border-sand-200/70 pt-5 text-[14.5px] text-ink-600">
                {t('jobs.closedForApplications')}
              </p>
            ) : !isWorker ? (
              <div className="mt-6 border-t border-sand-200/70 pt-5">
                <p className="text-[14.5px] text-ink-600">{t('jobs.mustLogin')}</p>
                {!isAuthenticated && (
                  <Button to="/connexion" size="lg" className="mt-4 w-full">{t('nav.login')}</Button>
                )}
              </div>
            ) : existingApp ? (
              <div className="mt-6 border-t border-sand-200/70 pt-5">
                <p className="text-[15px] font-medium text-vert-700">
                  {applyState === 'sent' ? t('jobs.applySuccess') : t('jobs.alreadyApplied')}
                </p>
                <p className="mt-2 text-[14px] text-ink-600">
                  {t('dash.status')} : {t(`appStatus.${existingApp.status}`)}
                </p>
                <Button
                  to="/tableau-de-bord/travailleur/candidatures"
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                >
                  {t('dash.myApps')}
                </Button>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleApply}>
                {/* Le CV porte l'essentiel de la candidature ; le message ne
                    fait plus que l'accompagner. */}
                <div className="rounded-xl border border-sand-200 bg-sand-50/60 p-4">
                  <p className="flex items-center gap-2 text-[14px] font-medium text-ink-800">
                    <Paperclip className="h-3.5 w-3.5" />
                    {t('cv.title')}
                  </p>

                  {cvFile ? (
                    <p className="mt-2 flex items-center gap-2 text-[13.5px] text-vert-700">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{cvFile.name}</span>
                      <button
                        type="button"
                        onClick={() => { setCvFile(null); setCvError('') }}
                        className="shrink-0 text-ink-400 underline-offset-2 hover:text-ocre-700 hover:underline"
                      >
                        {t('dash.cancel')}
                      </button>
                    </p>
                  ) : profileCv ? (
                    <p className="mt-2 flex items-center gap-2 text-[13.5px] text-ink-600">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-vert-700" />
                      <span className="min-w-0 flex-1 truncate">{profileCv.name || t('cv.fileFallback')}</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-[13.5px] text-ink-400">{t('cv.noneApply')}</p>
                  )}

                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-[13.5px] font-medium text-vert-700 hover:underline">
                    <Upload className="h-3.5 w-3.5" />
                    {profileCv || cvFile ? t('cv.attachOther') : t('cv.attach')}
                    <input
                      type="file"
                      accept={CV_ACCEPT}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        e.target.value = ''
                        const problem = describeCvProblem(file, t)
                        setCvError(problem || '')
                        setCvFile(problem ? null : file)
                      }}
                    />
                  </label>

                  {cvError && <p className="mt-2 text-[13px] text-red-600">{cvError}</p>}
                </div>

                <Textarea
                  label={t('jobs.message')}
                  hint={t('common.optional')}
                  placeholder={t('jobs.messagePh')}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                {applyState === 'error' && (
                  <p className="text-[14px] text-red-600">{t('jobs.applyError')}</p>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={applyState === 'sending'}>
                  {applyState === 'sending' ? '…' : t('jobs.send')}
                </Button>
              </form>
            )}

            <ReportButton kind="job" jobId={job.id} />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="border-t border-sand-200/70 bg-sand-100/40">
          <div className="shell py-16">
            <h2 className="text-[26px]">{t('jobs.similar')}</h2>
            <div className="mt-8 grid auto-rows-fr gap-5 lg:grid-cols-2">
              {similar.map((j, i) => (
                <Reveal key={j.id} delay={i * 80} className="h-full">
                  <JobCard j={j} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
