import { useState } from 'react'
import { Check, Flag } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from '../auth/AuthProvider'
import { submitReport } from '../lib/reports'
import { Textarea } from './ui/Field'

// Motifs proposés selon la cible. La gravité en découle côté base : une demande
// d'argent ou un harcèlement passent en tête de la file de l'admin.
const REASONS = {
  job: ['payment', 'misleading', 'salary', 'inappropriate', 'other'],
  profile: ['payment', 'harassment', 'fake', 'inappropriate', 'other'],
}

/**
 * « Signaler un abus » : motif, précision facultative, envoi vers `reports`.
 * Réservé aux travailleurs (règle en base) : rien ne s'affiche pour un employeur
 * ou un admin ; un visiteur est invité à se connecter avec un compte travailleur.
 */
export default function ReportButton({ kind, jobId, workerId }) {
  const { t } = useI18n()
  const { user, profile, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [state, setState] = useState('idle') // idle | sending | sent | duplicate
  const [error, setError] = useState('')

  if (isAuthenticated && profile?.role !== 'worker') return null

  if (state === 'sent' || state === 'duplicate') {
    return (
      <p className="mt-5 flex items-center justify-center gap-2 border-t border-sand-200/70 pt-5 text-center text-[13.5px] text-vert-700">
        <Check className="h-3.5 w-3.5 shrink-0" />
        {t(state === 'sent' ? 'contact.reportSent' : 'contact.reportDuplicate')}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-5 flex w-full items-center justify-center gap-2 border-t border-sand-200/70 pt-5 text-[13.5px] text-ink-400 transition-colors hover:text-ocre-700"
      >
        <Flag className="h-3.5 w-3.5" />
        {t('contact.report')}
      </button>
    )
  }

  if (!isAuthenticated) {
    return (
      <p className="mt-5 border-t border-sand-200/70 pt-5 text-center text-[13.5px] text-ink-400">
        {t('contact.reportLoginRequired')}
      </p>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) return
    setState('sending')
    setError('')
    try {
      await submitReport({ kind, jobId, workerId, reporterId: user.id, reason, details })
      setState('sent')
    } catch (err) {
      // Déjà signalé par ce compte et pas encore traité : ce n'est pas une erreur.
      if (err?.code === '23505') return setState('duplicate')
      setState('idle')
      setError(t('dash.actionError'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 border-t border-sand-200/70 pt-5">
      <p className="text-center text-[13.5px] font-medium text-ink-600">{t('contact.reportPrompt')}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2" role="radiogroup">
        {REASONS[kind].map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={reason === r}
            onClick={() => setReason(r)}
            className={`rounded-lg border px-3 py-1.5 text-[13px] transition-colors ${
              reason === r
                ? 'border-ocre-500 bg-ocre-50 text-ocre-700'
                : 'border-sand-300 bg-white text-ink-600 hover:border-ocre-500 hover:text-ocre-700'
            }`}
          >
            {t(`reportReason.${r}`)}
          </button>
        ))}
      </div>

      {reason && (
        <div className="mt-4 space-y-3">
          <Textarea
            label={t('contact.reportDetails')}
            rows={3}
            maxLength={1000}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t('contact.reportDetailsPlaceholder')}
          />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="h-10 w-full rounded-xl bg-ocre-700 text-[14px] font-medium text-white transition-colors hover:bg-ocre-500 disabled:opacity-50"
          >
            {state === 'sending' ? '…' : t('contact.reportSend')}
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-center text-[13px] text-red-600">{error}</p>}
    </form>
  )
}
