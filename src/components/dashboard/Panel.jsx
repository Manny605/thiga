/** Bloc de contenu — carte SaaS arrondie avec en-tête et action facultative. */
export default function Panel({ title, action, className = '', bodyClass = 'p-6', children }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-sand-200/70 bg-white shadow-card ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-sand-200/70 px-6 py-4">
          <h2 className="font-display text-[17px] text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  )
}
