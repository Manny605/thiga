import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, HardHat } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from '../auth/AuthProvider'
import { dashPathFor } from '../auth/roles'
import { useTrades } from '../trades/TradesProvider'
import { CITIES } from '../data/mock'
import { Wordmark } from '../components/layout/Header'
import { Input, Select } from '../components/ui/Field'
import Button from '../components/ui/Button'

const ROLES = [
  { id: 'employer', icon: Building2, title: 'auth.roleEmployer' },
  { id: 'worker', icon: HardHat, title: 'auth.roleWorker' },
]

export default function Register() {
  const { t } = useI18n()
  const { visibleTrades, tradeLabel } = useTrades()
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [role, setRole] = useState('worker')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [trade, setTrade] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)

    const { data, error: signUpError } = await signUp(email, password, {
      role,
      full_name: fullName,
      phone: phone || null,
      city: city || null,
      trade: role === 'worker' ? trade || 'autre' : null,
    })

    setSubmitting(false)

    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes('already registered')
          ? t('auth.errorEmailTaken')
          : t('auth.errorGeneric')
      )
      return
    }

    // Si la confirmation par e-mail est activée sur le projet Supabase, signUp
    // ne renvoie pas de session tant que le lien de confirmation n'est pas cliqué.
    if (!data.session) {
      setInfo(t('auth.confirmEmail'))
      return
    }

    // Le rôle du formulaire est celui que le trigger `handle_new_user` vient
    // d'écrire (il n'accepte que 'worker' ou 'employer').
    navigate(dashPathFor(role) || '/', { replace: true })
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-8 flex justify-center">
          <Wordmark imgClass="h-24 w-auto" />
        </div>

        <div className="border border-sand-200 bg-white p-8">
          <h1 className="text-[26px] leading-tight">{t('auth.registerTitle')}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-600">{t('auth.registerLede')}</p>

          {/* Sélecteur de rôle — deux boutons compacts */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {ROLES.map((r) => {
              const active = role === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-2.5 border p-3 text-start transition-colors ${
                    active
                      ? 'border-vert-600 bg-vert-50 text-vert-700'
                      : 'border-sand-300 bg-white text-ink-600 hover:border-sand-400'
                  }`}
                >
                  <r.icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                  <span className="text-[13.5px] font-medium">{t(r.title)}</span>
                </button>
              )
            })}
          </div>

          {info ? (
            <p className="mt-6 border-t border-sand-200/70 pt-5 text-[14px] leading-relaxed text-vert-700">
              {info}
            </p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Input
                label={t('auth.fullName')}
                placeholder="Mohamed Ould Ahmed"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label={t('auth.email')}
                type="email"
                placeholder="nom@exemple.mr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('auth.phone')}
                  type="tel"
                  placeholder="+222 …"
                  dir="ltr"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Select label={t('auth.city')} value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="" disabled>{t('common.allCities')}</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{t(`cities.${c}`)}</option>
                  ))}
                </Select>
              </div>

              {/* Champ propre aux travailleurs */}
              {role === 'worker' && (
                <Select label={t('auth.trade')} value={trade} onChange={(e) => setTrade(e.target.value)}>
                  <option value="" disabled>{t('common.allTrades')}</option>
                  {visibleTrades.map((tr) => (
                    <option key={tr.id} value={tr.id}>{tradeLabel(tr.id)}</option>
                  ))}
                </Select>
              )}

              <Input
                label={t('auth.password')}
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />

              {error && <p className="text-[13px] text-red-600">{error}</p>}

              <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
                {submitting ? '…' : t('auth.submitRegister')}
              </Button>
            </form>
          )}

          <p className="mt-4 text-center text-[12px] leading-relaxed text-ink-400">{t('auth.terms')}</p>
        </div>

        <p className="mt-6 text-center text-[13.5px] text-ink-600">
          {t('auth.hasAccount')}{' '}
          <Link to="/connexion" className="font-medium text-vert-700 hover:underline">
            {t('nav.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
