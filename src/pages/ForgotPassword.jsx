import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, PhoneCall } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { supabase } from '../lib/supabaseClient'
import { isValidMrPhone } from '../lib/contact'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import { Wordmark } from '../components/layout/Header'
import { Input, PhoneInput } from '../components/ui/Field'
import Button from '../components/ui/Button'

/**
 * Mot de passe oublié, sans e-mail : l'utilisateur dépose une demande avec son
 * numéro. L'équipe le rappelle au numéro enregistré sur son compte et lui
 * transmet un mot de passe temporaire, qu'il remplace à la connexion suivante.
 */
export default function ForgotPassword() {
  const { t } = useI18n()
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [state, setState] = useState('idle') // idle | sending | sent | error

  useDocumentMeta(t('auth.forgotTitle'), t('auth.forgotLede'))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValidMrPhone(phone)) {
      setPhoneError(t('auth.errPhone'))
      document.getElementById('forgot-phone')?.focus()
      return
    }
    setState('sending')
    // La réponse ne dit jamais si un compte existe : même message dans tous les cas.
    const { error } = await supabase.rpc('request_password_reset', { p_phone: phone, p_email: email.trim() || null })
    setState(error ? 'error' : 'sent')
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 py-16">
      <div
        className="motif pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md animate-rise">
        <div className="mb-8 flex justify-center">
          <Wordmark imgClass="h-20 w-auto" />
        </div>

        <div className="rounded-3xl border border-sand-200 bg-white p-8 shadow-card sm:p-9">
          {state === 'sent' ? (
            <div className="animate-fade text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-vert-50 text-vert-700 ring-8 ring-vert-50/50">
                <PhoneCall className="h-7 w-7" strokeWidth={1.5} />
              </span>
              <h1 className="mt-6 text-[26px] font-semibold leading-tight">{t('auth.forgotSentTitle')}</h1>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{t('auth.forgotSent')}</p>
            </div>
          ) : (
            <>
              <h1 className="text-[28px] font-semibold leading-tight">{t('auth.forgotTitle')}</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{t('auth.forgotLede')}</p>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
                <PhoneInput
                  id="forgot-phone"
                  label={t('auth.phone')}
                  placeholder="22 12 34 56"
                  value={phone}
                  onChange={(v) => { setPhone(v); setPhoneError('') }}
                  help={t('auth.forgotPhoneHelp')}
                  error={phoneError || undefined}
                />
                <Input
                  id="forgot-email"
                  icon={Mail}
                  label={t('auth.email')}
                  hint={t('auth.optional')}
                  type="email"
                  dir="ltr"
                  placeholder="nom@exemple.mr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {state === 'error' && <p className="text-[14px] text-red-600">{t('auth.errorGeneric')}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={state === 'sending'}>
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
