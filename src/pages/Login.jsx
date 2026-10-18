import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from '../auth/AuthProvider'
import { afterLoginPath } from '../auth/roles'
import { fetchProfile } from '../lib/profile'
import { Wordmark } from '../components/layout/Header'
import { Checkbox, Input, PasswordInput } from '../components/ui/Field'
import Button from '../components/ui/Button'

export default function Login() {
  const { t } = useI18n()
  const { signIn, signOut } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { data, error: signInError } = await signIn(email, password)

    if (signInError) {
      setSubmitting(false)
      setError(t('auth.errorInvalidCredentials'))
      return
    }

    let profile = null
    try {
      profile = await fetchProfile(data.user.id)
    } catch {
      profile = null
    }

    if (profile?.status === 'suspended') {
      await signOut()
      setSubmitting(false)
      setError(t('auth.errorSuspended'))
      return
    }

    setSubmitting(false)
    navigate(afterLoginPath(profile, state?.from) || '/', { replace: true })
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 py-16">
      <div
        className="motif pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        aria-hidden="true"
      />
      <div className="w-full max-w-sm animate-rise">
        <div className="mb-8 flex justify-center">
          <Wordmark imgClass="h-24 w-auto" />
        </div>

        <div className="rounded-3xl border border-sand-200 bg-white p-8 shadow-card sm:p-9">
          <h1 className="text-[28px] font-semibold leading-tight">{t('auth.loginTitle')}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{t('auth.loginLede')}</p>
          {state?.reason === 'employersOnly' && (
            <p className="mt-4 rounded-xl border border-ocre-300/70 bg-ocre-50 px-4 py-3 text-[14px] leading-relaxed text-ink-800">
              {t('auth.employersOnly')}{' '}
              <Link to="/inscription?role=employeur" className="font-medium text-vert-700 hover:underline">
                {t('auth.employersOnlyCta')}
              </Link>
            </p>
          )}

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <Input
              label={t('auth.email')}
              type="email"
              placeholder="nom@exemple.mr"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordInput
              label={t('auth.password')}
              showLabel={t('auth.showPassword')}
              hideLabel={t('auth.hidePassword')}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between pt-1">
              <Checkbox label={t('auth.remember')} />
              <Link to="/mot-de-passe-oublie" className="text-[13.5px] text-vert-700 hover:underline">
                {t('auth.forgot')}
              </Link>
            </div>

            {error && <p className="text-[14px] text-red-600">{error}</p>}

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
              {submitting ? '…' : t('auth.submitLogin')}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[14.5px] text-ink-600">
          {t('auth.noAccount')}{' '}
          <Link to="/inscription" className="font-medium text-vert-700 hover:underline">
            {t('nav.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
