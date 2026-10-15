import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { afterLoginPath } from './roles'

/**
 * Réservé aux visiteurs : accueil, connexion, inscription, à-propos.
 * Un utilisateur connecté y est renvoyé vers son portail.
 *
 * Les offres restent ouvertes à tous ; les travailleurs, aux employeurs et
 * à l'admin (cf. EmployersOnly). Arrivé sur la connexion depuis une fiche de
 * travailleur, un employeur y est ramené une fois connecté.
 */
export default function PublicOnly({ children }) {
  const { ready, isAuthenticated, profile } = useAuth()
  const location = useLocation()

  if (!ready) return null

  // Rôle inconnu (profil illisible) : pas de cible fiable, on laisse passer
  // plutôt que de boucler sur une redirection vers la page courante.
  const target = isAuthenticated && profile ? afterLoginPath(profile, location.state?.from) : null

  return target ? <Navigate to={target} replace /> : children
}
