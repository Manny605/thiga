/**
 * Date limite des annonces (`jobs.deadline`, jour inclus).
 * Comparée en UTC comme côté base : c'est aussi l'heure légale en Mauritanie.
 */
export function todayUtc() {
  return new Date().toISOString().slice(0, 10)
}

/** Vrai quand la date limite est passée ; une annonce sans date n'expire jamais. */
export function isExpired(deadline) {
  return !!deadline && deadline < todayUtc()
}

/** Jours entiers d'aujourd'hui (UTC) à la date limite : 0 = dernier jour, négatif = passée. */
export function daysUntil(deadline) {
  return Math.round((Date.parse(deadline) - Date.parse(todayUtc())) / 86400000)
}
