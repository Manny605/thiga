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
