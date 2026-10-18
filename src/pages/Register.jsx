import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Briefcase, Building2, HardHat, Lock, Mail, MailCheck, MapPin, UserRound } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from '../auth/AuthProvider'
import { dashPathFor } from '../auth/roles'
import { useTrades } from '../trades/TradesProvider'
import { supabase } from '../lib/supabaseClient'
import { formatMrPhone, isValidMrPhone } from '../lib/contact'
import { useDocumentMeta } from '../lib/useDocumentMeta'
import { CITIES } from '../data/mock'
import { Wordmark } from '../components/layout/Header'
import { Input, PasswordInput, PhoneInput, Select } from '../components/ui/Field'
import Button from '../components/ui/Button'
import StrengthMeter, { MIN_PASSWORD } from '../components/ui/StrengthMeter'

const ROLES = [
  { id: 'employer', icon: Building2, title: 'auth.roleEmployer', desc: 'auth.roleEmployerD' },
  { id: 'worker', icon: HardHat, title: 'auth.roleWorker', desc: 'auth.roleWorkerD' },
]

const ROLE_PARAM = { employeur: 'employer', employer: 'employer', travailleur: 'worker', worker: 'worker' }

const RESEND_COOLDOWN = 60

function validate({ role, fullName, email, phone, city, trade, password, confirm }) {
  const e = {}
  if (fullName.trim().length < 2) e.fullName = 'auth.errName'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'auth.errEmail'
  if (!isValidMrPhone(phone)) e.phone = 'auth.errPhone'
  if (!city) e.city = 'auth.errCity'
  if (role === 'worker' && !trade) e.trade = 'auth.errTrade'
  if (password.length < MIN_PASSWORD) e.password = 'auth.resetTooShort'
  if (!confirm) e.confirm = 'auth.errConfirm'
  else if (confirm !== password) e.confirm = 'auth.resetMismatch'
  return e
}

function RoleSwitch({ role, onChange }) {
  const { t } = useI18n()
  const index = ROLES.findIndex((r) => r.id === role)
  const current = ROLES[index]

  return (
    <div className="mt-7">
      <div role="radiogroup" aria-label={t('auth.chooseRole')} className="relative grid grid-cols-2 rounded-2xl bg-sand-100 p-1">
        <span
          aria-hidden="true"
          className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-card ring-1 ring-sand-200/70 transition-all duration-300 ease-out"
          style={{ insetInlineStart: index === 0 ? '4px' : '50%' }}
        />
        {ROLES.map((r) => {
          const active = r.id === role
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(r.id)}
              className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[14.5px] font-medium transition-colors ${
                active ? 'text-vert-800' : 'text-ink-600 hover:text-ink'
              }`}
            >
              <r.icon className={`h-[18px] w-[18px] ${active ? 'text-vert-700' : 'text-ink-400'}`} strokeWidth={1.75} />
              {t(r.title)}
            </button>
          )
        })}
      </div>
      <p key={role} className="mt-2.5 animate-fade text-center text-[13.5px] text-ink-400">
        {t(current.desc)}
      </p>
    </div>
  )
}

function CheckEmail({ email, onEdit }) {
  const { t } = useI18n()
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)
  const [state, setState] = useState('idle')

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const resend = async () => {
    setState('sending')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/connexion` },
    })
    setState(error ? 'error' : 'sent')
    setCooldown(RESEND_COOLDOWN)
  }

  return (
    <div className="animate-fade text-center">
      <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-vert-50 text-vert-700 ring-8 ring-vert-50/50">
        <MailCheck className="h-7 w-7" strokeWidth={1.5} />
      </span>
      <h1 className="mt-6 text-[26px] font-semibold leading-tight">{t('auth.checkEmailTitle')}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
        {t('auth.checkEmailBefore')} <strong dir="ltr" className="font-medium text-ink">{email}</strong>
        {t('auth.checkEmailAfter')}
      </p>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-400">{t('auth.checkEmailSpam')}</p>

      <div className="mt-7 flex flex-col gap-2.5">
        <Button variant="outline" onClick={resend} disabled={cooldown > 0 || state === 'sending'} className="w-full">
          {state === 'sending' ? '…' : cooldown > 0 ? `${t('auth.resendIn')} ${cooldown} s` : t('auth.resend')}
        </Button>
        {state === 'sent' && <p className="text-[14px] text-vert-700">{t('auth.resent')}</p>}
        {state === 'error' && <p className="text-[14px] text-red-600">{t('auth.errRateLimit')}</p>}
        <button type="button" onClick={onEdit} className="mt-1 text-[14px] text-vert-700 hover:underline">
          {t('auth.wrongEmail')}
        </button>
      </div>
    </div>
  )
}

export default function Register() {
  const { t } = useI18n()
  const { visibleTrades, tradeLabel } = useTrades()
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [role, setRole] = useState(ROLE_PARAM[params.get('role')] || 'worker')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [trade, setTrade] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useDocumentMeta(t('auth.registerTitle'), t('auth.registerLede'))

  const field = (name, setter, alsoClear) => (value) => {
    setter(value)
    if (errors[name] || errors[alsoClear]) {
      setErrors(({ [name]: _a, [alsoClear]: _b, ...rest }) => rest)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const found = validate({ role, fullName, email, phone, city, trade, password, confirm })
    setErrors(found)
    if (Object.keys(found).length) {
      document.getElementById(`register-${Object.keys(found)[0]}`)?.focus()
      return
    }

    setSubmitting(true)
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await signUp(cleanEmail, password, {
      role,
      full_name: fullName.trim().replace(/\s+/g, ' '),
      phone: formatMrPhone(phone),
      city,
      trade: role === 'worker' ? trade : null,
    })
    setSubmitting(false)

    const taken = error?.code === 'user_already_exists' || error?.code === 'email_exists' ||
      (!error && data.user && data.user.identities?.length === 0)
    if (taken) return setErrors({ email: 'auth.errorEmailTaken' })

    if (error) {
      if (error.code === 'weak_password') return setErrors({ password: 'auth.errWeakPassword' })
      if (error.code === 'email_address_invalid') return setErrors({ email: 'auth.errEmail' })
      if (error.status === 429) return setFormError(t('auth.errRateLimit'))
      return setFormError(t('auth.errorGeneric'))
    }

    if (!data.session) return setPendingEmail(cleanEmail)

    navigate(dashPathFor(role) || '/', { replace: true })
  }

  const err = (name) => (errors[name] ? t(errors[name]) : undefined)

  return (
    <div className="relative isolate overflow-hidden px-4 py-12 sm:px-5 md:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 start-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-vert-100/60 blur-3xl rtl:translate-x-1/2" />
        <div className="absolute -bottom-48 end-[-8rem] h-[26rem] w-[26rem] rounded-full bg-ocre-100/70 blur-3xl" />
        <div className="motif absolute inset-0 opacity-[0.04] [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)]" />
      </div>

      <div className="mx-auto w-full max-w-[31rem] animate-rise sm:max-w-2xl">
        <div className="relative rounded-[28px] bg-white/90 p-6 shadow-lift ring-1 ring-sand-200/80 backdrop-blur-xl sm:p-10">
          {pendingEmail ? (
            <CheckEmail email={pendingEmail} onEdit={() => setPendingEmail('')} />
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <Wordmark imgClass="h-14 w-auto" />
                <h1 className="mt-5 text-[30px] font-semibold leading-tight tracking-[-0.02em]">{t('auth.registerTitle')}</h1>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{t('auth.registerLede')}</p>
              </div>

              <RoleSwitch role={role} onChange={setRole} />

              <form className="mt-7 grid items-start gap-x-4 gap-y-5 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
                <Input
                  id="register-fullName"
                  icon={UserRound}
                  label={t('auth.fullName')}
                  placeholder="Mohamed Ould Ahmed"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => field('fullName', setFullName)(e.target.value)}
                  error={err('fullName')}
                />

                <Input
                  id="register-email"
                  icon={Mail}
                  label={t('auth.email')}
                  type="email"
                  dir="ltr"
                  placeholder="nom@exemple.mr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => field('email', setEmail)(e.target.value)}
                  error={err('email')}
                />

                <PhoneInput
                  id="register-phone"
                  label={t('auth.phone')}
                  placeholder="22 12 34 56"
                  value={phone}
                  onChange={field('phone', setPhone)}
                  error={err('phone')}
                />

                <Select
                  id="register-city"
                  icon={MapPin}
                  label={t('auth.city')}
                  value={city}
                  onChange={(e) => field('city', setCity)(e.target.value)}
                  error={err('city')}
                >
                  <option value="" disabled>{t('auth.pickCity')}</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{t(`cities.${c}`)}</option>
                  ))}
                </Select>

                {role === 'worker' && (
                  <div className="sm:col-span-2">
                    <Select
                      id="register-trade"
                      icon={Briefcase}
                      label={t('auth.trade')}
                      value={trade}
                      onChange={(e) => field('trade', setTrade)(e.target.value)}
                      error={err('trade')}
                    >
                      <option value="" disabled>{t('auth.pickTrade')}</option>
                      {visibleTrades.map((tr) => (
                        <option key={tr.id} value={tr.id}>{tradeLabel(tr.id)}</option>
                      ))}
                    </Select>
                  </div>
                )}

                <PasswordInput
                  id="register-password"
                  icon={Lock}
                  label={t('auth.password')}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => field('password', setPassword, 'confirm')(e.target.value)}
                  help={password ? undefined : t('auth.passwordHelp')}
                  error={err('password')}
                  showLabel={t('auth.showPassword')}
                  hideLabel={t('auth.hidePassword')}
                >
                  <StrengthMeter password={password} />
                </PasswordInput>

                <PasswordInput
                  id="register-confirm"
                  icon={Lock}
                  label={t('auth.confirm')}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => field('confirm', setConfirm)(e.target.value)}
                  error={err('confirm')}
                  showLabel={t('auth.showPassword')}
                  hideLabel={t('auth.hidePassword')}
                />

                {formError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700 sm:col-span-2">{formError}</p>
                )}

                <Button type="submit" size="lg" className="mt-1 w-full sm:col-span-2" disabled={submitting}>
                  {submitting ? '…' : (
                    <>
                      {t('auth.submitRegister')}
                      <ArrowRight className="flip-rtl h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="-mt-1 text-center text-[13px] leading-relaxed text-ink-400 sm:col-span-2">
                  {t('auth.termsBefore')}{' '}
                  <Link to="/conditions" className="text-ink-600 underline decoration-sand-300 underline-offset-2 hover:text-vert-700">{t('footer.terms')}</Link>
                  {' '}{t('auth.termsAnd')}{' '}
                  <Link to="/confidentialite" className="text-ink-600 underline decoration-sand-300 underline-offset-2 hover:text-vert-700">{t('footer.privacy')}</Link>
                  {t('auth.termsAfter')}
                </p>
              </form>

              <div className="mt-7 border-t border-sand-200/80 pt-6 text-center text-[14.5px] text-ink-600">
                {t('auth.hasAccount')}{' '}
                <Link to="/connexion" className="font-medium text-vert-700 hover:underline">
                  {t('nav.login')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
