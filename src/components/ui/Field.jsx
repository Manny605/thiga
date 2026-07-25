const control =
  'w-full bg-white border border-sand-300 rounded-xl text-sm text-ink shadow-sm ' +
  'placeholder:text-ink-400/70 transition-all ' +
  'hover:border-sand-400 focus:border-vert-600 focus:ring-4 focus:ring-vert-600/10 outline-none'

export function Label({ children, hint }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-[13px] font-medium text-ink-800">{children}</span>
      {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
    </span>
  )
}

export function Input({ label, hint, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <input className={`${control} h-11 px-3.5 ${className}`} {...rest} />
    </label>
  )
}

export function Textarea({ label, hint, rows = 5, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <textarea rows={rows} className={`${control} p-3.5 resize-y ${className}`} {...rest} />
    </label>
  )
}

export function Select({ label, hint, children, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <div className="relative">
        <select
          className={`${control} h-11 ps-3.5 pe-9 appearance-none cursor-pointer ${className}`}
          {...rest}
        >
          {children}
        </select>
        <svg
          viewBox="0 0 12 8"
          aria-hidden="true"
          className="pointer-events-none absolute end-3.5 top-1/2 h-2 w-3 -translate-y-1/2 fill-none stroke-ink-400 stroke-[1.5]"
        >
          <path d="M1 1.5 6 6.5 11 1.5" />
        </svg>
      </div>
    </label>
  )
}

export function Checkbox({ label, className = '', ...rest }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2.5 ${className}`}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded-md border-sand-400 text-vert-700 focus:ring-vert-700/40"
        {...rest}
      />
      <span className="text-[13px] text-ink-600">{label}</span>
    </label>
  )
}
