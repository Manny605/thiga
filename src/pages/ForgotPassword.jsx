import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { supabase } from '../lib/supabaseClient'
import { Wordmark } from '../components/layout/Header'
import { Input } from '../components/ui/Field'
import Button from '../components/ui/Button'

/** Page de destination du lien reçu par e-mail ; doit figurer dans les URL autorisées de Supabase Auth. */
export const RESET_PATH = '/nouveau-mot-de-passe'

export default function ForgotPassword() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | sending | sent | error | limited

  const handleSubmit = async (e) => {
    e.preventDefault()
    setState('sending')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${RESET_PATH}`,
    })
    // Supabase répond pareil qu'un compte existe ou non : la page fait de
    // même, pour ne pas révéler quelles adresses sont inscrites.
    if (!error) setState('sent')
    else setState(error.status === 429 ? 'limited' : 'error')
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
          <h1 className="text-[28px] font-semibold leading-tight">{t('auth.forgotTitle')}</h1>

          {state === 'sent' ? (
            <p className="mt-4 text-[15px] leading-relaxed text-vert-700">{t('auth.forgotSent')}</p>
          ) : (
            <>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{t('auth.forgotLede')}</p>
              <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
                <Input
                  id="forgot-email"
                  label={t('auth.email')}
                  type="email"
                  placeholder="nom@exemple.mr"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {state === 'error' && <p className="text-[14px] text-red-600">{t('auth.errorGeneric')}</p>}
                {state === 'limited' && <p className="text-[14px] text-red-600">{t('auth.forgotLimited')}</p>}
                <Button type="submit" size="lg" className="mt-2 w-full" disabled={state === 'sending'}>
                  {state === 'sending' ? '…' : t('auth.forgotSubmit')}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-[14.5px] text-ink-600">
          <Link to="/connexion" className="font-medium text-vert-700 hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}
