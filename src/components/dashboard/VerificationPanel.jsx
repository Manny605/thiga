import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import { fetchMyVerification, submitVerification } from '../../lib/verification'
import Panel from './Panel'
import StatusPill from './StatusPill'
import Button from '../ui/Button'
import { Input } from '../ui/Field'

const VERIFICATION_TONE = { pending: 'pending', approved: 'online', rejected: 'closed' }

/**
 * Statut de vérification d'identité + formulaire d'envoi du document.
 * Partagé par les espaces employeur et travailleur ; `ledeKey` adapte le texte
 * d'introduction (registre de commerce côté employeur, annuaire côté travailleur).
 */
export default function VerificationPanel({ profileId, ledeKey = 'verification.lede' }) {
  const { t } = useI18n()
  const [verification, setVerification] = useState(undefined) // undefined = chargement, null = aucune demande
  const [file, setFile] = useState(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // `null` en cas d'échec : le panneau propose alors d'envoyer un document,
  // plutôt que de rester bloqué sur un chargement muet.
  const load = () =>
    fetchMyVerification(profileId)
      .then(setVerification)
      .catch(() => setVerification(null))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return
    setSubmitting(true)
    setError('')
    try {
      await submitVerification(profileId, file, note)
      setFile(null)
      setNote('')
      await load()
    } catch {
      setError(t('verification.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (verification === undefined) return null

  const showForm = !verification || verification.status === 'rejected'

  return (
    <Panel title={t('verification.title')} className="mb-6">
      <p className="text-[14.5px] leading-relaxed text-ink-600">{t(ledeKey)}</p>

      {verification && (
        <div className="mt-4">
          <StatusPill status={VERIFICATION_TONE[verification.status]}>
            {t(`verification.${verification.status}`)}
          </StatusPill>
        </div>
      )}
      {verification?.status === 'rejected' && verification.reject_reason && (
        <div className="mt-4 rounded-xl border border-ocre-300/70 bg-ocre-50 px-4 py-3 text-[14px] leading-relaxed text-ink-800">
          <p>
            <span className="font-medium">{t('verification.reasonLabel')}</span> {t(`verification.reasons.${verification.reject_reason}`)}
          </p>
          {verification.review_note && <p className="mt-1 text-ink-600">{verification.review_note}</p>}
        </div>
      )}
      {!verification && (
        <p className="mt-4 text-[14px] text-ink-400">{t('verification.none')}</p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-medium text-ink-800">
              {t('verification.uploadLabel')}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-[14px] text-ink-600"
              required
            />
          </label>
          <Input
            label={t('verification.noteLabel')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <p className="text-[14px] text-red-600">{error}</p>}
          <Button type="submit" size="sm" disabled={submitting || !file}>
            {submitting ? t('verification.submitting') : t('verification.submit')}
          </Button>
        </form>
      )}
    </Panel>
  )
}
