// Pastilles de statut arrondies avec point de couleur — style SaaS moderne.
const TONES = {
  online: 'bg-vert-50 text-vert-700',
  pending: 'bg-ocre-100 text-ocre-700',
  closed: 'bg-sand-100 text-ink-400',
  new: 'bg-vert-600 text-white',
  seen: 'bg-sand-100 text-ink-600',
  shortlisted: 'bg-vert-50 text-vert-700',
  rejected: 'bg-sand-100 text-ink-400',
  high: 'bg-ocre-500 text-white',
  medium: 'bg-ocre-100 text-ocre-700',
  low: 'bg-sand-100 text-ink-400',
}

const DOTS = {
  online: 'bg-vert-600',
  pending: 'bg-ocre-500',
  closed: 'bg-ink-400/60',
  new: 'bg-white',
  seen: 'bg-ink-400',
  shortlisted: 'bg-vert-600',
  rejected: 'bg-ink-400/60',
  high: 'bg-white',
  medium: 'bg-ocre-500',
  low: 'bg-ink-400/60',
}

export default function StatusPill({ status, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${
        TONES[status] || TONES.seen
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status] || DOTS.seen}`} />
      {children}
    </span>
  )
}
