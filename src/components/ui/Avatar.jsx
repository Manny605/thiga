// Avatar généré à partir des initiales — pas d'image externe pendant la phase design.
const TINTS = [
  'bg-vert-100 text-vert-800',
  'bg-ocre-100 text-ocre-700',
  'bg-sand-200 text-ink-800',
  'bg-vert-700 text-sand-50',
]

const SIZES = {
  sm: 'h-9 w-9 text-[11px]',
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

export default function Avatar({ name = '', size = 'md', className = '' }) {
  const tint = TINTS[name.length % TINTS.length]
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full font-display font-medium ${tint} ${SIZES[size]} ${className}`}
    >
      {initials(name)}
    </span>
  )
}
