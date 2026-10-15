import { Navigate, useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'
import { useAuth } from './AuthProvider'
import { canViewWorkers } from './roles'
import AccountNotice from './AccountNotice'

/**
 * Catalogue et fiches des travailleurs : employeurs connectés (compte actif)
 * et admin. La base applique la même règle (can_view_workers) : cette garde
 * évite seulement d'afficher une page vide.
 *
 * Visiteur : vers la connexion, avec un mot d'explication, puis retour à la
 * page demandée (lien de fiche partagé, par exemple). Travailleur : vers les
 * offres, la seule partie du catalogue qui le concerne.
 */
export default function EmployersOnly({ children }) {
  const { t } = useI18n()
  const { ready, isAuthenticated, profile, mustChangePassword } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <div className="grid min-h-[50vh] place-items-center text-[14.5px] text-ink-400">{t('common.loading')}</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace state={{ from: location, reason: 'employersOnly' }} />
  }

  if (!profile) {
    return <AccountNotice title={t('auth.noProfileTitle')} lede={t('auth.noProfileLede')} />
  }

  if (profile.status === 'suspended') {
    return <AccountNotice title={t('auth.suspendedTitle')} lede={t('auth.suspendedLede')} />
  }

  if (mustChangePassword) {
    return <Navigate to="/nouveau-mot-de-passe" replace />
  }

  if (!canViewWorkers(profile)) {
    return <Navigate to="/offres" replace />
  }

  return children
}
