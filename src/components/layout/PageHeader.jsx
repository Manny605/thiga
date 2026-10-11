import Badge from '../ui/Badge'

/** Bandeau de titre commun aux pages intérieures — même motif atténué que l'accueil. */
export default function PageHeader({ kicker, title, lede, children }) {
  return (
    <section className="relative overflow-hidden border-b border-sand-200 bg-white">
      <div
        className="motif pointer-events-none absolute inset-0 opacity-[0.05] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_60%)]"
        aria-hidden="true"
      />
      <div className="shell relative py-12 md:py-16">
        {kicker && (
          <div className="mb-5 animate-fade">
            <Badge tone="ocre">{kicker}</Badge>
          </div>
        )}
        <h1 className="max-w-3xl animate-rise text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.06]">
          {title}
        </h1>
        {lede && (
          <p className="mt-5 max-w-xl animate-rise text-[16.5px] leading-relaxed text-ink-600 [animation-delay:.1s]">
            {lede}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  )
}
