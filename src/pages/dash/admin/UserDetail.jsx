import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CalendarDays, FileText, Mail, MapPin, ShieldQuestion, UserRoundSearch } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useTrades } from '../../../trades/TradesProvider'
import { fetchUserDetail, getVerificationDocumentUrl } from '../../../lib/admin'
import { getCvUrl } from '../../../lib/cv'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import ContactLine from '../../../components/dashboard/ContactLine'
import Avatar from '../../../components/ui/Avatar'
import Badge from '../../../components/ui/Badge'
import ReviewList from '../../../components/reviews/ReviewList'
import { useAdmin } from './AdminLayout'
import { ConfirmDelete, RowActions } from './Users'

const STATUS_TONE = { active: 'online', pending: 'pending', suspended: 'closed' }
const VERIF_TONE = { pending: 'pending', approved: 'online', rejected: 'closed' }

/** Ligne « libellé : valeur » des cartes d'information. */
function Row({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-sand-200/70 py-2.5 last:border-0">
      <dt className="text-[13.5px] text-ink-400">{label}</dt>
      <dd className="text-end text-[14.5px] font-medium text-ink">{children}</dd>
    </div>
  )
}

/** Fiche complète d'un compte, côté admin : visible quel que soit son statut ou sa vérification. */
export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, n, d } = useI18n()
  const { tradeLabel } = useTrades()
  const { patchUser, removeUser } = useAdmin()

  const [u, setU] = useState(undefined) // undefined = chargement, null = introuvable
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setU(await fetchUserDetail(id))
    } catch {
      setU(null)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  /** Les actions de la liste, puis relecture : la fiche reflète l'état réel en base. */
  const apply = async (userId, patch) => {
    setError('')
    try {
      await patchUser(userId, patch)
      await load()
    } catch {
      setError(t('dash.actionError'))
    }
  }

  const remove = async () => {
    setError('')
    setDeleting(true)
    try {
      await removeUser(u.id)
      navigate('/admin/utilisateurs', { replace: true })
    } catch (e) {
      setError(`${t('admin.deleteError')} ${e.message || ''}`.trim())
      setDeleting(false)
    }
  }

  const open = async (getUrl, path) => {
    setError('')
    try {
      window.open(await getUrl(path), '_blank', 'noopener')
    } catch {
      setError(t('admin.documentError'))
    }
  }

  const back = (
    <Link to="/admin/utilisateurs" className="inline-flex items-center gap-2 text-[14px] text-ink-600 transition-colors hover:text-vert-700">
      <ArrowLeft className="flip-rtl h-4 w-4" />
      {t('dash.users')}
    </Link>
  )

  if (u === undefined) return <div className="h-64 animate-pulse rounded-2xl bg-sand-100" aria-hidden="true" />

  if (!u) {
    return (
      <>
        {back}
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-sand-300 bg-white/60 px-6 py-20 text-center">
          <UserRoundSearch className="h-8 w-8 text-ink-400" strokeWidth={1.4} />
          <p className="mt-4 text-[15px] text-ink-600">{t('admin.userNotFound')}</p>
        </div>
      </>
    )
  }

  const w = u.worker

  return (
    <>
      {back}

      {/* ── En-tête : identité, statut, actions ── */}
      <Panel className="mt-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={u.name} src={u.avatar} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[22px] font-semibold leading-tight">{u.name}</h2>
                {u.verified && (
                  <Badge tone="solid">
                    <BadgeCheck className="h-3 w-3" />
                    {t('common.verified')}
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] text-ink-400">
                <span className="font-medium text-ocre-700">
                  {t(`admin.${u.role}`)}{w && <> · {tradeLabel(w.trade)}</>}
                </span>
                <StatusPill status={STATUS_TONE[u.status]}>{t(`admin.${u.status}`)}</StatusPill>
                {u.verification?.status === 'pending' && (
                  <Link to="/admin/verifications" className="inline-flex items-center gap-1 rounded-full bg-ocre-100 px-2 py-0.5 text-[12px] font-medium text-ocre-700 hover:bg-ocre-300/40">
                    <ShieldQuestion className="h-3 w-3" />
                    {t('admin.identityPending')}
                  </Link>
                )}
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t('admin.joined')} {d(u.joined)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <RowActions u={u} patchUser={apply} onDelete={() => setConfirming(true)} t={t} />
          </div>
        </div>

        {confirming && (
          <div className="mt-5">
            <ConfirmDelete u={u} busy={deleting} onConfirm={remove} onCancel={() => setConfirming(false)} />
          </div>
        )}
        {error && <p className="mt-4 text-[14px] text-red-600">{error}</p>}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* ── Colonne principale ── */}
        <div className="space-y-6 xl:col-span-2">
          {w && (
            <Panel title={t('admin.workProfile')}>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                <Row label={t('common.trade')}>{tradeLabel(w.trade)}</Row>
                <Row label={t('common.experience')}>{n(w.years || 0)} {t('common.years')}</Row>
                <Row label={t('common.rate')}>
                  {w.rate ? `${n(w.rate)} MRU ${w.unit ? t(`common.${w.unit}`) : ''}` : t('workers.rateUnset')}
                </Row>
                <Row label={t('workers.availability')}>{t(`availability.${w.availability}`)}</Row>
                {w.lastActive && <Row label={t('admin.lastActive')}>{d(w.lastActive)}</Row>}
                {w.refs > 0 && <Row label={t('workers.references')}>{n(w.refs)}</Row>}
              </dl>

              <h3 className="mt-6 text-[15px] font-semibold">{t('workers.about')}</h3>
              {w.bio ? (
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-800">{w.bio}</p>
              ) : (
                <p className="mt-2 text-[14.5px] italic text-ink-400">{t('workers.noBio')}</p>
              )}

              {(w.skills.length > 0 || w.langs.length > 0) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {w.skills.map((s) => <Badge key={s} tone="vert" className="px-3 py-1.5 text-[13px]">{s}</Badge>)}
                  {w.langs.map((l) => <Badge key={l} className="px-3 py-1.5 text-[13px]">{l}</Badge>)}
                </div>
              )}

              {w.cvPath && (
                <button
                  onClick={() => open(getCvUrl, w.cvPath)}
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-[13.5px] text-ink-600 transition-colors hover:border-vert-200 hover:text-vert-700"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {t('cv.view')}
                  <span className="max-w-[14rem] truncate text-ink-400">{w.cvName}</span>
                </button>
              )}
            </Panel>
          )}

          {/* Activité : annonces d'un employeur, candidatures d'un travailleur. */}
          <Panel title={t(u.role === 'employer' ? 'admin.jobsList' : 'admin.applicationsList')} bodyClass="">
            {(u.role === 'employer' ? u.jobs : u.applications).length === 0 ? (
              <p className="px-6 py-10 text-center text-[14.5px] text-ink-400">{t('admin.noActivity')}</p>
            ) : u.role === 'employer' ? (
              <ul className="divide-y divide-sand-200">
                {u.jobs.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5">
                    <div className="min-w-0 flex-1">
                      <Link to={`/offres/${j.id}`} className="block truncate text-[14.5px] font-medium text-ink hover:text-vert-700">
                        {j.title}
                      </Link>
                      <p className="mt-0.5 text-[13px] text-ink-400">
                        {d(j.date)} · {n(j.appsCount)} {t('dash.apps').toLowerCase()}
                      </p>
                    </div>
                    <StatusPill status={j.status}>{t(`jobStatus.${j.status}`)}</StatusPill>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="divide-y divide-sand-200">
                {u.applications.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 px-6 py-3.5">
                    <div className="min-w-0 flex-1">
                      <Link to={`/offres/${a.jobId}`} className="block truncate text-[14.5px] font-medium text-ink hover:text-vert-700">
                        {a.jobTitle}
                      </Link>
                      <p className="mt-0.5 text-[13px] text-ink-400">{a.employer} · {d(a.date)}</p>
                    </div>
                    <StatusPill status={a.status}>{t(`appStatus.${a.status}`)}</StatusPill>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <ReviewList profileId={u.id} />
        </div>

        {/* ── Colonne latérale : contact et vérification ── */}
        <div className="space-y-6">
          <Panel title={t('admin.contact')}>
            <dl>
              <Row label={t('auth.email')}>
                {u.email ? (
                  <span dir="ltr" className="inline-flex items-center gap-1.5 break-all font-normal">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                    <span className="select-all">{u.email}</span>
                  </span>
                ) : null}
              </Row>
              <Row label={t('common.city')}>
                <span className="inline-flex items-center gap-1.5 font-normal">
                  <MapPin className="h-3.5 w-3.5 text-ink-400" />
                  {[u.city && t(`cities.${u.city}`), w?.district].filter(Boolean).join(' · ')}
                </span>
              </Row>
              {u.role === 'employer' && u.employerType && <Row label={t('dash.employerTypeLabel')}>{u.employerType}</Row>}
            </dl>
            <ContactLine label={t('auth.phone')} phone={u.phone} />
          </Panel>

          <Panel title={t('verification.title')}>
            {u.verification ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusPill status={VERIF_TONE[u.verification.status]}>{t(`admin.verif.${u.verification.status}`)}</StatusPill>
                  <span className="text-[13px] text-ink-400">{d(u.verification.date)}</span>
                </div>
                {u.verification.status === 'rejected' && u.verification.rejectReason && (
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-800">
                    <span className="text-ink-400">{t('verification.reasonLabel')}</span> {t(`verification.reasons.${u.verification.rejectReason}`)}
                    {u.verification.reviewNote && <span className="block text-ink-600">{u.verification.reviewNote}</span>}
                  </p>
                )}
                {u.verification.note && (
                  <p className="mt-3 text-[14px] leading-relaxed text-ink-600">« {u.verification.note} »</p>
                )}
                <button
                  onClick={() => open(getVerificationDocumentUrl, u.verification.documentPath)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-[13.5px] text-ink-600 transition-colors hover:border-vert-200 hover:text-vert-700"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {t('admin.viewDocument')}
                </button>
              </>
            ) : (
              <p className="text-[14px] text-ink-400">{t('verification.none')}</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
