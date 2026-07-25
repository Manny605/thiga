import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from './AuthProvider'
import Button from '../components/ui/Button'

/**
 * Écran plein cadre pour un compte connecté mais inutilisable : suspendu par
 * l'administration, ou profil introuvable. Sans lui, les gardes de route
 * renvoyaient `null` — un écran blanc sans explication ni porte de sortie.
 */
export default function AccountNotice({ title, lede }) {
  const { t } = useI18n()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-5">
      <div className="w-full max-w-sm animate-rise border border-sand-200 bg-white p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-ocre-100 text-ocre-700">
          <ShieldOff className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 text-[22px] leading-tight">{title}</h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-600">{lede}</p>
        <Button onClick={handleLogout} variant="outline" size="sm" className="mt-7 w-full">
          {t('dash.logout')}
        </Button>
      </div>
    </div>
  )
}
