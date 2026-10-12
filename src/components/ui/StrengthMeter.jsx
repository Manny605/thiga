import { useI18n } from '../../i18n/I18nProvider'

/** Longueur minimale d'un mot de passe, partout dans l'application. */
export const MIN_PASSWORD = 8

/** Robustesse indicative de 0 à 4 : longueur, mélange lettres/chiffres, casse ou symboles. */
function strength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= MIN_PASSWORD) score++
  if (pw.length >= 12) score++
  if (/\d/.test(pw) && /[a-zA-Z]/.test(pw)) score++
  if ((/[a-z]/.test(pw) && /[A-Z]/.test(pw)) || /[^a-zA-Z0-9]/.test(pw)) score++
  // Trop court : jamais au-dessus de « faible », quel que soit le mélange.
  return pw.length < MIN_PASSWORD ? 1 : Math.max(score, 1)
}

const STRENGTH_COLOR = ['', 'bg-red-400', 'bg-ocre-500', 'bg-vert-300', 'bg-vert-600']

/** Jauge de robustesse sous un champ mot de passe ; rien tant qu'il est vide. */
export default function StrengthMeter({ password }) {
  const { t } = useI18n()
  const score = strength(password)
  if (!score) return null
  return (
    <span className="mt-2 flex items-center gap-3" aria-live="polite">
      <span className="flex flex-1 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= score ? STRENGTH_COLOR[score] : 'bg-sand-200'}`}
          />
        ))}
      </span>
      <span className="w-20 text-end text-[12.5px] font-medium text-ink-600">{t(`auth.strength${score}`)}</span>
    </span>
  )
}

