import Reveal from '../ui/Reveal'

/** Tuile de statistique — style SaaS : carte arrondie, ombre douce, KPI large. */
export default function StatCard({ icon: Icon, label, value, trend, delay = 0 }) {
  return (
    <Reveal
      delay={delay}
      className="group relative rounded-2xl border border-sand-200 bg-white p-5 transition-colors duration-300 hover:border-ink/30"
    >
      <div className="relative flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-vert-700 text-white">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        {trend != null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12.5px] font-semibold tabular-nums ${
              trend >= 0 ? 'bg-vert-50 text-vert-600' : 'bg-ocre-100 text-ocre-700'
            }`}
          >
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)} %
          </span>
        )}
      </div>
      <p className="relative mt-6 font-display text-[34px] leading-none text-ink tabular-nums">{value}</p>
      <p className="relative mt-2 text-[14px] text-ink-400">{label}</p>
    </Reveal>
  )
}
