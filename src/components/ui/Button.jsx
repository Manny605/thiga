import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ' +
  'disabled:opacity-40 disabled:pointer-events-none select-none'

const variants = {
  // Vert plein : action principale
  primary:
    'bg-vert-700 text-sand-50 shadow-sm hover:bg-vert-800 hover:shadow-lift active:translate-y-px',
  // Contour encre : action secondaire
  outline:
    'border border-sand-300 bg-white text-ink shadow-sm hover:border-vert-200 hover:bg-vert-50/40 hover:text-vert-700 active:translate-y-px',
  // Ocre : accent rare, réservé aux appels forts
  accent:
    'bg-ocre-500 text-white shadow-sm hover:bg-ocre-700 active:translate-y-px',
  // Discret : navigation interne
  ghost: 'text-ink-600 hover:text-vert-700 hover:bg-vert-50',
  // Sur fond sombre
  invert:
    'bg-sand-50 text-vert-800 shadow-sm hover:bg-white active:translate-y-px',
}

const sizes = {
  sm: 'h-9 px-4 text-[14px] rounded-xl',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-[52px] px-7 text-[15px] rounded-xl',
}

export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>
  if (href) return <a href={href} className={cls} {...rest}>{children}</a>
  const Tag = as || 'button'
  return <Tag className={cls} {...rest}>{children}</Tag>
}
