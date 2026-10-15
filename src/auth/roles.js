/** Portail d'accueil de chaque rôle — source unique pour toutes les redirections. */
export const DASH_PATHS = {
  admin: '/admin',
  employer: '/tableau-de-bord/employeur',
  worker: '/tableau-de-bord/travailleur',
}

/** Chemin du portail correspondant au rôle, ou null si le rôle est inconnu. */
export function dashPathFor(role) {
  return DASH_PATHS[role] || null
}

/** Profils des travailleurs : employeurs actifs et admin (règle en base : can_view_workers). */
export function canViewWorkers(profile) {
  return !!profile && profile.status === 'active' && (profile.role === 'employer' || profile.role === 'admin')
}

/**
 * Destination après connexion : la page demandée avant la connexion si ce
 * compte peut la voir (fiche de travailleur partagée), sinon son portail.
 */
export function afterLoginPath(profile, from) {
  const path = from?.pathname ? `${from.pathname}${from.search || ''}` : ''
  if (path.startsWith('/travailleurs') && canViewWorkers(profile)) return path
  return dashPathFor(profile?.role)
}
