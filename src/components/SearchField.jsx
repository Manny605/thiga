import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'

/**
 * Champ de recherche par mots-clés. La saisie est locale ; `onChange` n'est
 * appelé qu'après une courte pause, pour ne pas lancer une requête par lettre.
 */
export default function SearchField({ id, value, onChange, placeholder, label, clearLabel }) {
  const [draft, setDraft] = useState(value)

  // Une valeur venue de l'URL (retour arrière, réinitialisation) remplace la saisie.
  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (draft === value) return undefined
    const timer = setTimeout(() => onChange(draft.trim()), 350)
    return () => clearTimeout(timer)
    // `onChange` change à chaque rendu du parent : seule la saisie compte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft])

  return (
    <label className="relative block" htmlFor={id}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        id={id}
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-sand-300 bg-white pe-11 ps-11 text-[15px] text-ink shadow-sm outline-none transition-all placeholder:text-ink-400/80 hover:border-sand-400 focus:border-vert-600 focus:ring-4 focus:ring-vert-600/10 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => { setDraft(''); onChange('') }}
          aria-label={clearLabel}
          className="absolute end-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-sand-100 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  )
}
