import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BadgeCheck, Check, Clock, FileText, Languages, Link2, MapPin, MessageCircle,
  Phone, Quote, Share2, Sparkles, Star, UserRoundSearch, Wallet,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from '../auth/AuthProvider'
import { useTrades } from '../trades/TradesProvider'
import { fetchWorkerById, searchWorkers } from '../lib/workers'
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
import { RatingSummary, Stars } from '../components/reviews/Stars'
import { useDocumentMeta } from '../lib/useDocumentMeta'

const LANG_LABEL = {
  ar: 'العربية',
  fr: 'Français',
  pulaar: 'Pulaar',
  wolof: 'Wolof',
  soninke: 'Soninké',
  hassaniya: 'Hassaniya',
}

const DOT = { now: 'bg-vert-600', soon: 'bg-ocre-500', busy: 'bg-ink-400' }

/** Une case de la grille de chiffres clés, sous l'en-tête. */
function Fact({ icon: Icon, label, children }) {
  return (
    <div className="rounded-2xl border border-sand-200/80 bg-white p-4 shadow-sm sm:p-5">
      <p className="flex items-center gap-2 text-[12.5px] font-medium uppercase tracking-[0.1em] text-ink-400">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        {label}
      </p>
      <div className="mt-2 text-[17px] font-semibold leading-tight text-ink">{children}</div>
    </div>
  )
}

/** Partage du profil : feuille de partage du téléphone si elle existe, sinon copie du lien ; WhatsApp à part. */
function ShareButtons({ name, trade }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const url = typeof window === 'undefined' ? '' : window.location.href
  const text = `${name}, ${trade} · THIGA`

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url })
        return
      } catch {
        // Partage annulé ou refusé : on retombe sur la copie du lien.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Presse-papiers indisponible : rien de plus à faire sans boîte de dialogue.
    }
  }

  const btn = 'inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[14px] font-medium transition-colors'

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={share} className={`${btn} border-sand-300 bg-white text-ink-600 hover:border-vert-200 hover:text-vert-700`}>
        {copied ? <Check className="h-4 w-4 text-vert-600" /> : navigator.share ? <Share2 className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied ? t('workers.copied') : t('workers.share')}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btn} border-vert-100 bg-vert-50 text-vert-700 hover:bg-vert-700 hover:text-sand-50`}
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="shell pb-16 pt-6">
        <div className="h-4 w-28 rounded bg-sand-100" />
        <div className="mt-6 h-24 w-24 rounded-full bg-sand-200" />
        <div className="mt-5 h-8 w-64 rounded-lg bg-sand-200" />
        <div className="mt-3 h-5 w-40 rounded-lg bg-sand-100" />
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-sand-100" />)}
        </div>
      </div>
    </div>
  )
}

export default function WorkerDetail() {
  const { id } = useParams()
  const { t, n, d } = useI18n()
  const { user, isAuthenticated, profile } = useAuth()
  const { tradeLabel } = useTrades()

  const [w, setW] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [cvError, setCvError] = useState('')

  useDocumentMeta(w && `${w.name} · ${tradeLabel(w.trade)}`, w?.bio)

  const isEmployer = isAuthenticated && profile?.role === 'employer'
  const isOwn = !!user && user.id === id

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
    fetchWorkerById(id)
      .then(async (worker) => {
        if (cancelled) return
        setW(worker)
        setLoading(false)
        if (!worker) return
        // Profils du même métier : une seule page de recherche, sans le profil affiché.
        const { rows } = await searchWorkers({ trade: worker.trade })
        if (!cancelled) setSimilar(rows.filter((x) => x.id !== worker.id).slice(0, 3))
      })
      .catch(() => {
        if (cancelled) return
        setW(null)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [id])

  if (loading) return <Skeleton />

  if (!w) {
    return (
      <div className="shell flex flex-col items-center py-28 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-sand-100 text-ink-400">
          <UserRoundSearch className="h-8 w-8" strokeWidth={1.4} />
        </span>
        <h1 className="mt-6 text-[28px] font-semibold">{t('workers.notFoundTitle')}</h1>
        <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-ink-600">{t('workers.notFoundLede')}</p>
        <Button to="/travailleurs" className="mt-8">{t('nav.workers')}</Button>
      </div>
    )
  }

  const where = [w.city && t(`cities.${w.city}`), w.district].filter(Boolean).join(' · ')

  return (
    <>
      {/* ── En-tête : retour, avatar, identité, partage ── */}
      <section className="border-b border-sand-200 bg-white">
        <div className="shell pb-8 pt-6">
          <Link
            to="/travailleurs"
            className="inline-flex items-center gap-2 text-[14px] text-ink-600 transition-colors hover:text-vert-700"
          >
            <ArrowLeft className="flip-rtl h-4 w-4" />
            {t('nav.workers')}
          </Link>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={w.name} src={w.avatar} size="xl" className="animate-fade shadow-card ring-4 ring-sand-100 sm:h-28 sm:w-28" />
              <div className="animate-rise">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-[clamp(1.7rem,3.6vw,2.5rem)] font-semibold leading-tight">{w.name}</h1>
                  {w.verified && (
                    <Badge tone="solid">
                      <BadgeCheck className="h-3 w-3" />
                      {t('common.verified')}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[15px]">
                  <span className="font-medium text-ocre-700">{tradeLabel(w.trade)}</span>
                  {where && (
                    <span className="flex items-center gap-1.5 text-ink-400">
                      <MapPin className="h-4 w-4" />
                      {where}
                    </span>
                  )}
                  {w.rating && <RatingSummary stats={w.rating} className="text-[14px]" />}
                </p>
              </div>
            </div>
            <div className="animate-fade">
              <ShareButtons name={w.name} trade={tradeLabel(w.trade)} />
            </div>
          </div>

          {/* ── Chiffres clés en grille ── */}
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Fact icon={Clock} label={t('common.experience')}>
              {n(w.years || 0)} {t('common.years')}
            </Fact>
            <Fact icon={Wallet} label={t('common.rate')}>
              {w.rate ? (
                <>
                  {n(w.rate)} <span className="text-[13px] font-normal text-ink-400">MRU {w.unit ? t(`common.${w.unit}`) : ''}</span>
                </>
              ) : (
                <span className="text-[15px] font-normal text-ink-400">{t('workers.rateUnset')}</span>
              )}
            </Fact>
            <Fact icon={Sparkles} label={t('workers.availability')}>
              <span className="flex items-center gap-2 text-[15px]">
                <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[w.availability] || DOT.busy}`} />
                {t(`availability.${w.availability}`)}
              </span>
            </Fact>
            <Fact icon={Star} label={t('workers.rating')}>
              {w.rating?.total ? (
                <span className="flex items-center gap-2">
                  {n(w.rating.average)}
                  <Stars value={w.rating.average} size="h-3.5 w-3.5" />
                </span>
              ) : (
                <span className="text-[15px] font-normal text-ink-400">{t('workers.noReviews')}</span>
              )}
            </Fact>
          </div>
        </div>
      </section>

      <div className="shell grid gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-14">
        <article className="space-y-10 lg:col-span-7 xl:col-span-8">
          <section>
            <h2 className="text-[22px] font-semibold">{t('workers.about')}</h2>
            {w.bio ? (
              <p className="mt-4 whitespace-pre-line text-[16px] leading-[1.75] text-ink-800">{w.bio}</p>
            ) : (
              <p className="mt-4 text-[15px] italic text-ink-400">{t('workers.noBio')}</p>
            )}
            {w.refs > 0 && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-vert-50 px-3 py-1 text-[13.5px] text-vert-700">
                <Star className="h-3.5 w-3.5" />
                {n(w.refs)} {t('workers.references').toLowerCase()}
              </p>
            )}
          </section>

          {(w.skills.length > 0 || w.langs.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {w.skills.length > 0 && (
                <section className="rounded-2xl border border-sand-200/80 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
                  <h2 className="text-[17px] font-semibold">{t('common.skills')}</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {w.skills.map((s) => (
                      <Badge key={s} tone="vert" className="px-3 py-1.5 text-[13.5px]">{s}</Badge>
                    ))}
                  </div>
                </section>
              )}
              {w.langs.length > 0 && (
                <section className="rounded-2xl border border-sand-200/80 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
                  <h2 className="text-[17px] font-semibold">{t('common.languages')}</h2>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {w.langs.map((l) => (
                      <li key={l} className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-[14px] text-ink-600">
                        <Languages className="h-3.5 w-3.5 text-vert-600" />
                        {LANG_LABEL[l] || l}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          <ReviewList profileId={w.id} />
        </article>

        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-28">
            <div className="rounded-2xl border border-sand-200/70 bg-white p-6 shadow-card">
              {isOwn ? (
                <>
                  <h2 className="text-[19px] font-semibold leading-snug">{t('workers.ownTitle')}</h2>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-600">{t('workers.ownLede')}</p>
                  <Button to="/tableau-de-bord/travailleur/profil" size="lg" className="mt-5 w-full">
                    {t('workers.editMine')}
                  </Button>
                </>
              ) : applications.length > 0 ? (
                /* Dossier de candidature : ce que ce travailleur a envoyé à cet
                   employeur, CV compris. Lui proposer ici de « publier une
                   annonce » n'aurait aucun sens, il a déjà postulé. */
                <>
                  <h2 className="text-[19px] font-semibold leading-snug">{t('workers.appliedTitle')}</h2>
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

                  <Button to="/tableau-de-bord/employeur/candidatures" variant="outline" size="sm" className="mt-5 w-full">
                    {t('dash.applicants')}
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-[19px] font-semibold leading-snug">{t('workers.contactTitle')}</h2>
                  {/* Pas de messagerie : la mise en relation passe par une
                      annonce, puis par le téléphone une fois présélectionné. */}
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-600">{t('workers.contactLede')}</p>

                  {isEmployer ? (
                    <Button to="/tableau-de-bord/employeur/annonces" size="lg" className="mt-5 w-full">
                      {t('dash.newJob')}
                    </Button>
                  ) : !isAuthenticated && (
                    <div className="mt-5 grid gap-2.5">
                      <Button to="/inscription?role=employeur" size="lg" className="w-full">
                        {t('workers.visitorCta')}
                      </Button>
                      <Button to="/connexion" variant="outline" className="w-full">
                        {t('nav.login')}
                      </Button>
                    </div>
                  )}

                  <p className="mt-5 flex items-start gap-2 rounded-xl bg-sand-50 px-3.5 py-3 text-[13.5px] leading-relaxed text-ink-600">
                    <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vert-600" />
                    {t('common.phoneHidden')}
                  </p>
                </>
              )}

              {!isOwn && <ReportButton kind="profile" workerId={w.id} />}
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="border-t border-sand-200/70 bg-sand-100/40">
          <div className="shell py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-[26px] font-semibold">{t('workers.similar')}</h2>
              <Link to={`/travailleurs?metier=${w.trade}`} className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-vert-700 hover:underline">
                {tradeLabel(w.trade)}
                <ArrowRight className="flip-rtl h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((x, i) => (
                <Reveal key={x.id} delay={i * 80} className="h-full">
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
