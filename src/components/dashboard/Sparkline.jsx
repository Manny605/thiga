/** Courbe de fréquentation en SVG pur, sans dépendance de graphiques. */
export default function Sparkline({ data, height = 90 }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const step = 100 / (data.length - 1)

  const pts = data.map((v, i) => [i * step, 100 - ((v - min) / span) * 100])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  const area = `${line} L100 100 L0 100 Z`

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ height }}
      className="w-full"
      role="img"
    >
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F4C3A" stopOpacity=".16" />
          <stop offset="100%" stopColor="#0F4C3A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path
        d={line}
        fill="none"
        stroke="#0F4C3A"
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      {pts.slice(-1).map(([x, y]) => (
        <circle key="last" cx={x} cy={y} r="2.4" fill="#C8873A" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  )
}
