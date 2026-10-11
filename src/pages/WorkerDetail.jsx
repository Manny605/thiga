import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, BadgeCheck, Clock, FileText, Languages, MapPin, Phone, Quote,
  Star, Wallet,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from '../auth/AuthProvider'
import { useTrades } from '../trades/TradesProvider'
import { fetchWorkerById, fetchWorkers } from '../lib/workers'
import { fetchApplicationsFromWorker } from '../lib/employerDash'
import { getCvUrl } from '../lib/cv'
import StatusPill from '../components/dashboard/StatusPill'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import WorkerCard from '../components/WorkerCard'
import ReportButton from '../components/ReportButton'
import Reveal from '../components/ui/Reveal'
import ReviewList from '../components/reviews/ReviewList'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const LANG_LABEL = {
  ar: 'العربية',
  fr: 'Français',
  pulaar: 'Pulaar',
  wolof: 'Wolof',
}

export default function WorkerDetail() {
  const { id } = useParams()
  const { t, n, d } = useI18n()
  const { user, isAuthenticated, profile } = useAuth()
  const { tradeLabel } = useTrades()

  const [w, setW] = useState(null)
  const [similar, setSimilar] = useState([])

  useDocumentMeta(w && `${w.name} — ${tradeLabel(w.trade)}`, w?.bio)
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [cvError, setCvError] = useState('')

  const isEmployer = isAuthenticated && profile?.role === 'employer'

  // Cet employeur a-t-il reçu une candidature de ce travailleur ? Si oui, la
  // fiche cesse d'être une vitrine et devient un dossier de candidature.
  useEffect(() => {
    let cancelled = false
    if (!isEmployer || !user?.id) {
      setApplications([])
      return undefined
    }
    fetchApplicationsFromWorker(user.id, id)
      .then((rows) => { if (!cancelled) setApplications(rows) })
      .catch(() => { if (!cancelled) setApplications([]) })
    return () => { cancelled = true }
  }, [isEmployer, user?.id, id])

  const openCv = async (path) => {
    setCvError('')
    try {
      window.open(await getCvUrl(path), '_blank', 'noopener')
    } catch {
      setCvError(t('cv.openError'))
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchWorkerById(id), fetchWorkers()])
      .then(([worker, all]) => {
        if (cancelled) return
        setW(worker)
        setSimilar(worker ? all.filter((x) => x.id !== worker.id && x.trade === worker.trade).slice(0, 3) : [])
      })
      .catch(() => { if (!cancelled) setW(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return <div className="shell py-32 text-center text-ink-400">{t('common.loading')}</div>
  }

  if (!w) {
    return (
      <div className="shell py-32 text-center">
        <h1 className="text-3xl">404</h1>
        <p className="mt-3 text-ink-600">{t('common.empty')}</p>
        <Button to="/travailleurs" className="mt-8">{t('nav.workers')}</Button>
      </div>
    )
  }

  return (
    <>
      <div className="border-b border-sand-200/70 bg-sand-100/40">
        <div className="shell py-5">
          <Link
            to="/travailleurs"
            className="inline-flex items-center gap-2 text-[14px] text-ink-600 transition-colors hover:text-vert-700"
          >
            <ArrowLeft className="flip-rtl h-4 w-4" />
            {t('nav.workers')}
          </Link>
        </div>
      </div>

      {/* Bandeau profil */}
      <section className="border-b border-sand-200 bg-white">
        <div className="shell py-12 md:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar name={w.name} src={w.avatar} size="xl" className="animate-fade" />
            <div className="flex-1 animate-rise">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[clamp(1.8rem,4vw,2.7rem)] leading-tight">{w.name}</h1>
                {w.verified && (
                  <Badge tone="solid">
                    <BadgeCheck className="h-3 w-3" />
                    {t('common.verified')}
                  </Badge>
                )}
              </div>
              <p className="mt-2 font-display text-[19px] text-ocre-700">{tradeLabel(w.trade)}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14.5px] text-ink-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {w.city && t(`cities.${w.city}`)}{w.district ? ` · ${w.district}` : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {w.years} {t('common.years')} {t('common.experience').toLowerCase()}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4" />
                  {w.refs} {t('workers.references').toLowerCase()}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="shell grid gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-16">
        <article className="lg:col-span-7 xl:col-span-8">
          <h2 className="text-[22px]">{t('workers.about')}</h2>
          <p className="mt-4 text-[16px] leading-[1.75] text-ink-800">{w.bio}</p>

          {w.skills.length > 0 && (
            <section className="mt-12 border-t border-sand-200/70 pt-8">
              <h2 className="text-[22px]">{t('common.skills')}</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {w.skills.map((s) => (
                  <Badge key={s} tone="vert" className="px-3 py-1.5 text-[13.5px]">{s}</Badge>
                ))}
              </div>
            </section>
          )}

          {w.langs.length > 0 && (
            <section className="mt-10 border-t border-sand-200/70 pt-8">
              <h2 className="text-[22px]">{t('common.languages')}</h2>
              <ul className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                {w.langs.map((l) => (
                  <li key={l} className="flex items-center gap-2 text-[15.5px] text-ink-600">
                    <Languages className="h-4 w-4 text-vert-600" />
                    {LANG_LABEL[l] || l}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ReviewList profileId={w.id} className="mt-10" />
        </article>

        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-28 rounded-2xl border border-sand-200/70 bg-white p-6 shadow-card">
            <div className="flex items-baseline justify-between border-b border-sand-200/70 pb-5">
              <div>
                <p className="text-[12.5px] uppercase tracking-[0.12em] text-ink-400">
                  {t('common.rate')}
                </p>
                <p className="mt-1.5 font-display text-[26px] leading-none text-vert-700">
                  {n(w.rate || 0)}{' '}
                  <span className="text-[14px] text-ink-400">MRU {w.unit ? t(`common.${w.unit}`) : ''}</span>
                </p>
              </div>
              <Wallet className="h-5 w-5 text-sand-400" />
            </div>

            <p className="mt-5 flex items-center gap-2 text-[14px] text-ink-600">
              <span
                className={`h-2 w-2 rounded-full ${
                  w.availability === 'now'
                    ? 'bg-vert-600'
                    : w.availability === 'soon'
                    ? 'bg-ocre-500'
                    : 'bg-ink-400'
                }`}
              />
              {t(`availability.${w.availability}`)}
            </p>

            {applications.length > 0 ? (
              /* Dossier de candidature : ce que ce travailleur a envoyé à cet
                 employeur, CV compris. Lui proposer ici de « publier une
                 annonce » n'aurait aucun sens, il a déjà postulé. */
              <>
                <h2 className="mt-6 text-[19px] leading-snug">{t('workers.appliedTitle')}</h2>
                <ul className="mt-4 space-y-4">
                  {applications.map((a) => (
                    <li key={a.id} className="border-t border-sand-200/70 pt-4 first:border-0 first:pt-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          to={`/offres/${a.jobId}`}
                          className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-ink transition-colors hover:text-vert-700"
                        >
                          {a.jobTitle}
                        </Link>
                        <StatusPill status={a.status}>{t(`appStatus.${a.status}`)}</StatusPill>
                      </div>
                      <p className="mt-1 text-[12.5px] text-ink-400">{d(a.date)}</p>

                      {a.cvPath && (
                        <button
                          onClick={() => openCv(a.cvPath)}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-[13.5px] text-ink-600 transition-colors hover:border-vert-200 hover:text-vert-700"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {t('cv.view')}
                        </button>
                      )}

                      {a.message && (
                        <p className="mt-3 flex gap-2 border-s-2 border-sand-300 ps-3 text-[13.5px] leading-relaxed text-ink-600">
                          <Quote className="mt-0.5 h-3 w-3 shrink-0 text-sand-400" />
                          {a.message}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>

                {cvError && <p className="mt-3 text-[13.5px] text-red-600">{cvError}</p>}

                <Button
                  to="/tableau-de-bord/employeur/candidatures"
                  variant="outline"
                  size="sm"
                  className="mt-5 w-full"
                >
                  {t('dash.applicants')}
                </Button>
              </>
            ) : (
              <>
                <h2 className="mt-6 text-[19px] leading-snug">{t('workers.contactTitle')}</h2>
                {/* Le formulaire d'origine n'envoyait rien (`preventDefault` seul).
                    Tant qu'il n'y a pas de messagerie, la mise en relation passe
                    par une annonce : on l'indique au lieu de la simuler. */}
                <p className="mt-2 text-[14px] leading-relaxed text-ink-600">{t('workers.contactLede')}</p>

                {isEmployer ? (
                  <Button to="/tableau-de-bord/employeur/annonces" size="lg" className="mt-5 w-full">
                    {t('dash.newJob')}
                  </Button>
                ) : isAuthenticated ? null : (
                  <Button to="/connexion" size="lg" className="mt-5 w-full">
                    {t('nav.login')}
                  </Button>
                )}

                <p className="mt-4 flex items-center justify-center gap-2 text-[13.5px] text-ink-400">
                  <Phone className="h-3.5 w-3.5" />
                  {t('common.phoneHidden')}
                </p>
              </>
            )}

            <ReportButton kind="profile" workerId={w.id} />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="border-t border-sand-200/70 bg-sand-100/40">
          <div className="shell py-16">
            <h2 className="text-[26px]">{t('workers.similar')}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((x, i) => (
                <Reveal key={x.id} delay={i * 80}>
                  <WorkerCard w={x} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
