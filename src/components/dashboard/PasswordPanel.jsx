import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useI18n } from '../../i18n/I18nProvider'
import { useAuth } from '../../auth/AuthProvider'
import { supabase } from '../../lib/supabaseClient'
import { PasswordInput } from '../ui/Field'
import StrengthMeter, { MIN_PASSWORD } from '../ui/StrengthMeter'
import Button from '../ui/Button'
import Panel from './Panel'

/**
 * Changement du mot de passe depuis les paramètres — employeur, travailleur
 * et admin. Le mot de passe actuel est revérifié d'abord : une session laissée
 * ouverte sur un téléphone prêté ne doit pas suffire à prendre le compte.
 */
export default function PasswordPanel() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  if (!user?.email) return null

  /** Met à jour un champ et efface les erreurs qui le concernent. */
  const field = (setter, ...names) => (e) => {
    setter(e.target.value)
    setMessage('')
    if (names.some((n) => errors[n])) {
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !names.includes(k))))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setMessage('')

    const found = {}
    if (!current) found.current = 'password.errCurrent'
    if (password.length < MIN_PASSWORD) found.password = 'auth.resetTooShort'
    if (!confirm) found.confirm = 'auth.errConfirm'
    else if (confirm !== password) found.confirm = 'auth.resetMismatch'
    setErrors(found)
    if (Object.keys(found).length) return

    setSaving(true)
    // Revérification : une connexion avec l'ancien mot de passe, sur le même compte.
    const { error: checkError } = await supabase.auth.signInWithPassword({ email: user.email, password: current })
    if (checkError) {
      setSaving(false)
      return setErrors({ current: checkError.status === 429 ? 'auth.errRateLimit' : 'password.wrongCurrent' })
    }

    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      if (error.code === 'same_password') return setErrors({ password: 'auth.resetSame' })
      if (error.code === 'weak_password') return setErrors({ password: 'auth.errWeakPassword' })
      return setFormError(t('auth.errorGeneric'))
    }

    setCurrent('')
    setPassword('')
    setConfirm('')
    setMessage(t('password.saved'))
  }

  const err = (name) => (errors[name] ? t(errors[name]) : undefined)
  const toggle = { showLabel: t('auth.showPassword'), hideLabel: t('auth.hidePassword') }

  return (
    <Panel title={t('password.title')} className="mt-6">
      <p className="text-[14.5px] leading-relaxed text-ink-600">{t('password.lede')}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 grid max-w-2xl items-start gap-x-4 gap-y-5 sm:grid-cols-2">
        {/* Le gestionnaire de mots de passe du navigateur s'appuie sur ce champ caché. */}
        <input type="email" autoComplete="username" value={user.email} readOnly hidden />

        <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
          <PasswordInput
            id="password-current"
            icon={Lock}
            label={t('password.current')}
            autoComplete="current-password"
            value={current}
            onChange={field(setCurrent, 'current')}
            error={err('current')}
            {...toggle}
          />
        </div>

        <PasswordInput
          id="password-new"
          icon={Lock}
          label={t('auth.newPassword')}
          autoComplete="new-password"
          value={password}
          onChange={field(setPassword, 'password', 'confirm')}
          help={password ? undefined : t('auth.passwordHelp')}
          error={err('password')}
          {...toggle}
        >
          <StrengthMeter password={password} />
        </PasswordInput>

        <PasswordInput
          id="password-confirm"
          icon={Lock}
          label={t('auth.confirm')}
          autoComplete="new-password"
          value={confirm}
          onChange={field(setConfirm, 'confirm')}
          error={err('confirm')}
          {...toggle}
        />

        {formError && <p className="text-[14px] text-red-600 sm:col-span-2">{formError}</p>}
        {message && <p className="text-[14px] text-vert-700 sm:col-span-2">{message}</p>}

        <div className="sm:col-span-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? '…' : t('password.submit')}
          </Button>
        </div>
      </form>
    </Panel>
  )
}
