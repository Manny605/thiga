import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from '../auth/AuthProvider'
import { dashPathFor } from '../auth/roles'
import { supabase } from '../lib/supabaseClient'
import { Wordmark } from '../components/layout/Header'
import { PasswordInput } from '../components/ui/Field'
import Button from '../components/ui/Button'

const MIN_LENGTH = 8

/**
 * Arrivée depuis le lien de réinitialisation : Supabase a déjà ouvert une
 * session de récupération à partir du jeton de l'URL. Sans session, le lien
 * est expiré, déjà utilisé, ou la page a été ouverte directement.
 */
export default function ResetPassword() {
  const { t } = useI18n()
  const { ready, session, profile } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [state, setState] = useState('idle') // idle | saving | done
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < MIN_LENGTH) return setError(t('auth.resetTooShort'))
    if (password !== confirm) return setError(t('auth.resetMismatch'))

    setState('saving')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setState('idle')
      setError(updateError.code === 'same_password' ? t('auth.resetSame') : t('auth.errorGeneric'))
      return
    }
    setState('done')
  }

  if (!ready) return null

  let body
  if (state === 'done') {
    body = (
      <>
        <p className="mt-4 text-[15px] leading-relaxed text-vert-700">{t('auth.resetDone')}</p>
        <Button to={dashPathFor(profile?.role) || '/'} size="lg" className="mt-6 w-full">
          {t('auth.goToSpace')}
        </Button>
      </>
    )
  } else if (!session) {
    body = (
      <>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-600">{t('auth.resetInvalidLink')}</p>
        <Button to="/mot-de-passe-oublie" size="lg" className="mt-6 w-full">
          {t('auth.forgotSubmit')}
        </Button>
      </>
    )
  } else {
    body = (
      <>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{t('auth.resetLede')}</p>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <PasswordInput
            id="reset-password"
            label={t('auth.newPassword')}
            hint={t('auth.resetHint')}
            showLabel={t('auth.showPassword')}
            hideLabel={t('auth.hidePassword')}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PasswordInput
            id="reset-confirm"
            label={t('auth.confirm')}
            showLabel={t('auth.showPassword')}
            hideLabel={t('auth.hidePassword')}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error && <p className="text-[14px] text-red-600">{error}</p>}
          <Button type="submit" size="lg" className="mt-2 w-full" disabled={state === 'saving'}>
            {state === 'saving' ? '…' : t('auth.resetSubmit')}
          </Button>
        </form>
      </>
    )
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 py-16">
      <div
        className="motif pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm animate-rise">
        <div className="mb-8 flex justify-center">
          <Wordmark imgClass="h-24 w-auto" />
        </div>
        <div className="rounded-3xl border border-sand-200 bg-white p-8 shadow-card sm:p-9">
          <h1 className="text-[28px] font-semibold leading-tight">{t('auth.resetTitle')}</h1>
          {body}
        </div>
        {state !== 'done' && (
          <p className="mt-6 text-center text-[14.5px] text-ink-600">
            <Link to="/connexion" className="font-medium text-vert-700 hover:underline">
              {t('auth.backToLogin')}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
