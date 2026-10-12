import { Navigate, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from './AuthProvider'
import { dashPathFor } from './roles'
import AccountNotice from './AccountNotice'

/** Protège une route : connexion requise, rôle exact, compte non suspendu. */
export default function RequireRole({ role, children }) {
  const { t } = useI18n()
  const { ready, isAuthenticated, profile, mustChangePassword } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-[14.5px] text-ink-400">{t('common.loading')}</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location }} />
  }

  // Session valide mais ligne `profiles` absente ou illisible : sans cette
  // branche, la garde renvoyait `null` indéfiniment.
  if (!profile) {
    return <AccountNotice title={t('auth.noProfileTitle')} lede={t('auth.noProfileLede')} />
  }

  if (profile.status === 'suspended') {
    return <AccountNotice title={t('auth.suspendedTitle')} lede={t('auth.suspendedLede')} />
  }

  if (mustChangePassword) {
    return <Navigate to="/nouveau-mot-de-passe" replace />
  }

  if (profile.role !== role) {
    return <Navigate to={dashPathFor(profile.role) || '/'} replace />
  }

  return children
}
