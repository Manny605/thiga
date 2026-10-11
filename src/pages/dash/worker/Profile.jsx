import { useEffect, useState } from 'react'
import { FileText, Trash2, Upload } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import { updateMyWorkerProfile } from '../../../lib/workerDash'
import { CV_ACCEPT, describeCvProblem, detachCv, getCvUrl, uploadCv } from '../../../lib/cv'
import Panel from '../../../components/dashboard/Panel'
import VerificationPanel from '../../../components/dashboard/VerificationPanel'
import Button from '../../../components/ui/Button'
import { Input, Select, Textarea } from '../../../components/ui/Field'
import { useWorkerDash } from './WorkerLayout'

/** Dépôt, consultation et retrait du CV rattaché au profil. */
function CvPanel({ workerId, profile, onChanged }) {
  const { t, d } = useI18n()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permet de re-sélectionner le même fichier après une erreur
    if (!file) return

    const problem = describeCvProblem(file, t)
    if (problem) {
      setError(problem)
      setMessage('')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')
    try {
      await uploadCv(workerId, file, profile.cvPath)
      await onChanged()
      setMessage(t('cv.uploaded'))
    } catch {
      setError(t('cv.uploadError'))
    } finally {
      setBusy(false)
    }
  }

  const handleView = async () => {
    setError('')
    try {
      window.open(await getCvUrl(profile.cvPath), '_blank', 'noopener')
    } catch {
      setError(t('cv.openError'))
    }
  }

  const handleRemove = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await detachCv(workerId, profile.cvPath)
      await onChanged()
      setMessage(t('cv.removed'))
    } catch {
      setError(t('cv.removeError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel title={t('cv.title')} className="mb-6">
      <p className="text-[14.5px] leading-relaxed text-ink-600">{t('cv.lede')}</p>

      {profile.cvPath ? (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-sand-200 bg-sand-50/60 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-vert-50 text-vert-700">
            <FileText className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-medium text-ink">{profile.cvName || t('cv.fileFallback')}</p>
            {profile.cvUploadedAt && (
              <p className="mt-0.5 text-[12.5px] text-ink-400">{t('cv.uploadedOn')} {d(profile.cvUploadedAt)}</p>
            )}
          </div>
          <button
            onClick={handleView}
            className="h-9 rounded-lg border border-sand-300 bg-white px-3 text-[13.5px] text-ink-600 transition-colors hover:border-vert-200 hover:text-vert-700"
          >
            {t('cv.view')}
          </button>
          <button
            onClick={handleRemove}
            disabled={busy}
            title={t('cv.remove')}
            className="grid h-9 w-9 place-items-center rounded-lg border border-sand-300 bg-white text-ink-400 transition-colors hover:border-ocre-500 hover:text-ocre-700 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <p className="mt-4 text-[14px] text-ink-400">{t('cv.none')}</p>
      )}

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-[14px] font-medium text-ink shadow-sm transition-colors hover:border-vert-200 hover:text-vert-700">
        <Upload className="h-4 w-4" strokeWidth={1.75} />
        {busy ? t('cv.uploading') : profile.cvPath ? t('cv.replace') : t('cv.upload')}
        <input type="file" accept={CV_ACCEPT} onChange={handleFile} disabled={busy} className="hidden" />
      </label>

      <p className="mt-2 text-[12.5px] text-ink-400">{t('cv.constraints')}</p>

      {message && <p className="mt-3 text-[14px] text-vert-700">{message}</p>}
      {error && <p className="mt-3 text-[14px] text-red-600">{error}</p>}
    </Panel>
  )
}

export default function Profile() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { workerProfile, reload } = useWorkerDash()

  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState('')
  const [langs, setLangs] = useState('')
  const [rate, setRate] = useState('')
  const [unit, setUnit] = useState('perMonth')
  const [availability, setAvailability] = useState('now')
  const [years, setYears] = useState('')
  const [district, setDistrict] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!workerProfile) return
    setBio(workerProfile.bio || '')
    setSkills((workerProfile.skills || []).join(', '))
    setLangs((workerProfile.langs || []).join(', '))
    setRate(workerProfile.rate ?? '')
    setUnit(workerProfile.unit || 'perMonth')
    setAvailability(workerProfile.availability || 'now')
    setYears(workerProfile.years ?? '')
    setDistrict(workerProfile.district || '')
  }, [workerProfile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      await updateMyWorkerProfile(user.id, {
        bio,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        langs: langs.split(',').map((s) => s.trim()).filter(Boolean),
        rate: rate !== '' ? Number(rate) : null,
        unit,
        availability,
        years: years !== '' ? Number(years) : 0,
        district,
      })
      setMessage(t('dash.profileSaved'))
      reload()
    } catch {
      setError(t('dash.profileSaveError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!workerProfile) return null

  return (
    <>
      {/* Un profil non vérifié n'apparaît pas dans l'annuaire : la demande
          se fait ici, comme pour les employeurs. */}
      {user && !workerProfile.verified && (
        <VerificationPanel profileId={user.id} ledeKey="verification.ledeWorker" />
      )}

      {user && <CvPanel workerId={user.id} profile={workerProfile} onChanged={reload} />}

      <Panel title={t('dash.myProfile')}>
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          <Textarea label={t('dash.bioLabel')} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          <Input label={t('dash.skillsLabel')} value={skills} onChange={(e) => setSkills(e.target.value)} />
          <Input label={t('dash.langsLabel')} value={langs} onChange={(e) => setLangs(e.target.value)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('common.rate')}
              type="number"
              min="0"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
            <Select label={t('common.rate')} value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="perMonth">{t('common.perMonth')}</option>
              <option value="perDay">{t('common.perDay')}</option>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select label={t('common.availability')} value={availability} onChange={(e) => setAvailability(e.target.value)}>
              <option value="now">{t('availability.now')}</option>
              <option value="soon">{t('availability.soon')}</option>
              <option value="busy">{t('availability.busy')}</option>
            </Select>
            <Input
              label={t('dash.yearsLabel')}
              type="number"
              min="0"
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
          </div>

          <Input label={t('dash.districtLabel')} value={district} onChange={(e) => setDistrict(e.target.value)} />

          {message && <p className="text-[14px] text-vert-700">{message}</p>}
          {error && <p className="text-[14px] text-red-600">{error}</p>}

          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? '…' : t('dash.save')}
          </Button>
        </form>
      </Panel>
    </>
  )
}
