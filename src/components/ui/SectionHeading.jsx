import Reveal from './Reveal'

/** Titre de section avec numéro — style SaaS moderne, sans filet dur. */
export default function SectionHeading({ num, kicker, title, lede, action, className = '' }) {
  return (
    <Reveal className={className}>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {(num || kicker) && (
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-sand-200 bg-white px-3 py-1 shadow-sm">
              {num && (
                <span className="font-display text-[13px] text-ocre-500 tabular-nums">{num}</span>
              )}
              {kicker && (
                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-600">
                  {kicker}
                </span>
              )}
            </div>
          )}
          <h2 className="text-[clamp(1.7rem,3.4vw,2.6rem)] leading-[1.12]">{title}</h2>
          {lede && <p className="mt-4 text-[15px] leading-relaxed text-ink-600">{lede}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </Reveal>
  )
}
