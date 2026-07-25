import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { dashPathFor } from './roles'

/**
 * Réservé aux visiteurs : accueil, connexion, inscription, à-propos.
 * Un utilisateur connecté y est renvoyé vers son portail.
 *
 * Le catalogue (offres, travailleurs, fiches) reste ouvert aux connectés :
 * c'est de là qu'un travailleur postule, qu'un employeur consulte un profil
 * depuis ses candidatures et qu'un admin inspecte une annonce à modérer.
 */
export default function PublicOnly({ children }) {
  const { ready, isAuthenticated, profile } = useAuth()

  if (!ready) return null

  // Rôle inconnu (profil illisible) : pas de cible fiable, on laisse passer
  // plutôt que de boucler sur une redirection vers la page courante.
  const target = isAuthenticated && profile ? dashPathFor(profile.role) : null

  return target ? <Navigate to={target} replace /> : children
}
