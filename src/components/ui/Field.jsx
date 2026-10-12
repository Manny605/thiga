import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const control =
  'w-full bg-white border border-sand-300 rounded-xl text-sm text-ink shadow-sm ' +
  'placeholder:text-ink-400/70 transition-all ' +
  'hover:border-sand-400 focus:border-vert-600 focus:ring-4 focus:ring-vert-600/10 outline-none'

// Champ en erreur : bordure et halo rouges, à la place du vert.
const invalid = '!border-red-400 focus:!ring-red-500/10'

export function Label({ children, hint }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-[14px] font-medium text-ink-800">{children}</span>
      {hint && <span className="text-[12px] text-ink-400">{hint}</span>}
    </span>
  )
}

/** Icône en tête de champ ; `Icon` est un composant lucide. */
function Lead({ icon: Icon }) {
  if (!Icon) return null
  return <Icon className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-400" strokeWidth={1.75} />
}

/** Message sous un champ ; `error` prime sur l'aide `help`. */
function Below({ error, help }) {
  if (error) return <span className="mt-1.5 block text-[13px] text-red-600">{error}</span>
  if (help) return <span className="mt-1.5 block text-[13px] leading-relaxed text-ink-400">{help}</span>
  return null
}

export function Input({ label, hint, help, error, icon, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <span className="relative block">
        <Lead icon={icon} />
        <input
          className={`${control} h-11 pe-3.5 ${icon ? 'ps-10' : 'ps-3.5'} ${error ? invalid : ''} ${className}`}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
      </span>
      <Below error={error} help={help} />
    </label>
  )
}

/** Mot de passe avec bouton afficher / masquer : sur téléphone, on tape à l'aveugle sinon. */
export function PasswordInput({ label, hint, help, error, icon, showLabel, hideLabel, className = '', children, ...rest }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <span className="relative block">
        <Lead icon={icon} />
        <input
          type={visible ? 'text' : 'password'}
          className={`${control} h-11 pe-11 ${icon ? 'ps-10' : 'ps-3.5'} ${error ? invalid : ''} ${className}`}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="absolute end-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-sand-100 hover:text-ink"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      {children}
      <Below error={error} help={help} />
    </label>
  )
}

/**
 * Numéro mauritanien : l'indicatif +222 est affiché à part, on ne saisit que
 * les 8 chiffres, regroupés deux à deux pendant la frappe. `value` et
 * `onChange` portent les seuls chiffres.
 */
export function PhoneInput({ label, hint, help, error, value, onChange, className = '', ...rest }) {
  const shown = value.replace(/(\d{2})(?=\d)/g, '$1 ')
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <span dir="ltr" className="relative block">
        <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-600">
          +222
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={shown}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').replace(/^(00)?222/, '').slice(0, 8))}
          className={`${control} h-11 pe-3.5 ps-[3.75rem] tabular-nums tracking-wide ${error ? invalid : ''} ${className}`}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
      </span>
      <Below error={error} help={help} />
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

export function Select({ label, hint, help, error, icon, children, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <div className="relative">
        <Lead icon={icon} />
        <select
          className={`${control} h-11 pe-9 appearance-none cursor-pointer ${icon ? 'ps-10' : 'ps-3.5'} ${error ? invalid : ''} ${className}`}
          aria-invalid={error ? true : undefined}
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
      <Below error={error} help={help} />
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
      <span className="text-[14px] text-ink-600">{label}</span>
    </label>
  )
}
