const tones = {
  neutral: 'bg-sand-100 text-ink-600 border-sand-300',
  vert: 'bg-vert-50 text-vert-700 border-vert-100',
  ocre: 'bg-ocre-100 text-ocre-700 border-ocre-300/60',
  solid: 'bg-vert-700 text-sand-50 border-vert-700',
}

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium leading-none rounded-full ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
