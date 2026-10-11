import { useState } from 'react'

// Photo de profil si `src` est fourni, sinon (ou si l'image échoue) initiales sur fond teinté.
const TINTS = [
  'bg-vert-100 text-vert-800',
  'bg-ocre-100 text-ocre-700',
  'bg-sand-200 text-ink-800',
  'bg-vert-700 text-sand-50',
]

const SIZES = {
  sm: 'h-9 w-9 text-[12px]',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function Avatar({ name = '', src = null, size = 'md', className = '' }) {
  const tint = TINTS[name.length % TINTS.length]
  // Mémorise l'URL en échec plutôt qu'un booléen : une nouvelle photo réessaie d'elle-même.
  const [failed, setFailed] = useState(null)
  const shape = `inline-grid shrink-0 place-items-center rounded-full ${SIZES[size]} ${className}`

  if (src && failed !== src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={() => setFailed(src)}
        className={`${shape} bg-sand-200 object-cover`}
      />
    )
  }

  return (
    <span aria-hidden="true" className={`${shape} font-display font-medium ${tint}`}>
      {initials(name)}
    </span>
  )
}
