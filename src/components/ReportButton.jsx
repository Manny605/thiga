import { useState } from 'react'
import { Check, Flag } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from '../auth/AuthProvider'
import { submitReport } from '../lib/reports'

const REASONS = ['misleading', 'fake', 'salary']

/** Bouton « Signaler un abus » : ouvre un choix de motif, envoie vers `reports`. */
export default function ReportButton({ kind, jobId, workerId }) {
  const { t } = useI18n()
  const { user, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (sent) {
    return (
      <p className="mt-5 flex items-center justify-center gap-2 border-t border-sand-200/70 pt-5 text-[12.5px] text-vert-700">
        <Check className="h-3.5 w-3.5" />
        {t('contact.reportSent')}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-5 flex w-full items-center justify-center gap-2 border-t border-sand-200/70 pt-5 text-[12.5px] text-ink-400 transition-colors hover:text-ocre-700"
      >
        <Flag className="h-3.5 w-3.5" />
        {t('contact.report')}
      </button>
    )
  }

  if (!isAuthenticated) {
    return (
      <p className="mt-5 border-t border-sand-200/70 pt-5 text-center text-[12.5px] text-ink-400">
        {t('contact.reportLoginRequired')}
      </p>
    )
  }

  const handleReason = async (reason) => {
    setSubmitting(true)
    setError('')
    try {
      await submitReport({ kind, jobId, workerId, reporterId: user.id, reason })
      setSent(true)
    } catch {
      // L'échec restait silencieux : le panneau semblait simplement ne rien faire.
      setError(t('dash.actionError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-5 border-t border-sand-200/70 pt-5">
      <p className="text-center text-[12px] text-ink-400">{t('contact.reportPrompt')}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {REASONS.map((r) => (
          <button
            key={r}
            disabled={submitting}
            onClick={() => handleReason(r)}
            className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-[12px] text-ink-600 transition-colors hover:border-ocre-500 hover:text-ocre-700 disabled:opacity-40"
          >
            {t(`reportReason.${r}`)}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-center text-[12px] text-red-600">{error}</p>}
    </div>
  )
}
