import Badge from '../ui/Badge'

/** Bandeau de titre commun aux pages intérieures. */
export default function PageHeader({ kicker, title, lede, children }) {
  return (
    <section className="border-b border-sand-200 bg-white">
      <div className="shell py-14 md:py-20">
        {kicker && (
          <div className="mb-5 animate-fade">
            <Badge tone="ocre">{kicker}</Badge>
          </div>
        )}
        <h1 className="max-w-3xl animate-rise text-[clamp(2rem,5vw,3.4rem)] leading-[1.06]">
          {title}
        </h1>
        {lede && (
          <p className="mt-5 max-w-xl animate-rise text-[15.5px] leading-relaxed text-ink-600 [animation-delay:.1s]">
            {lede}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  )
}
