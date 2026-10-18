import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useTrades } from '../../../trades/TradesProvider'
import {
  createTrade, updateTrade, deleteTrade, setTradeEnabled, fetchTradeUsage, slugify,
} from '../../../lib/trades'
import Panel from '../../../components/dashboard/Panel'
import TradeIcon, { ICON_NAMES } from '../../../components/TradeIcon'
import Button from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Field'

const CORE_TRADE = 'autre'

function TradeForm({ trade, existingIds, onSaved, onCancel }) {
  const { t } = useI18n()
  const editing = !!trade

  const [labelFr, setLabelFr] = useState(trade?.labelFr || '')
  const [labelAr, setLabelAr] = useState(trade?.labelAr || '')
  const [icon, setIcon] = useState(trade?.icon || 'Boxes')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const slug = editing ? trade.id : slugify(labelFr)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!editing && existingIds.includes(slug)) {
      setError(t('admin.tradeExists'))
      return
    }

    setSubmitting(true)
    try {
      if (editing) {
        await updateTrade(trade.id, { labelFr: labelFr.trim(), labelAr: labelAr.trim(), icon })
        onSaved(t('admin.tradeUpdated'))
      } else {
        await createTrade({ id: slug, labelFr: labelFr.trim(), labelAr: labelAr.trim(), icon })
        onSaved(t('admin.tradeCreated'))
      }
    } catch (err) {
      setError(err?.code === '23505' ? t('admin.tradeExists') : t('admin.tradeSaveError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel title={editing ? t('admin.editTrade') : t('admin.addTrade')} className="mb-6">
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <Input
          label={t('admin.tradeLabelFr')}
          value={labelFr}
          onChange={(e) => setLabelFr(e.target.value)}
          required
        />
        <Input
          label={t('admin.tradeLabelAr')}
          hint={t('common.optional')}
          dir="rtl"
          value={labelAr}
          onChange={(e) => setLabelAr(e.target.value)}
        />

        <div>
          <span className="mb-1.5 block text-[14px] font-medium text-ink-800">{t('admin.tradeIcon')}</span>
          <div className="flex flex-wrap gap-1.5">
            {ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setIcon(name)}
                aria-pressed={icon === name}
                aria-label={name}
                title={name}
                className={`grid h-10 w-10 place-items-center rounded-lg border transition-colors ${
                  icon === name
                    ? 'border-ocre-500 bg-ocre-100 text-ocre-700'
                    : 'border-sand-300 bg-white text-ink-400 hover:border-sand-400 hover:text-ink'
                }`}
              >
                <TradeIcon name={name} className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-[13.5px] text-ink-400">
          {t('admin.tradeSlug')} : <span className="font-mono text-ink-600">{slug}</span>
          {!editing && <> · {t('admin.tradeSlugHint')}</>}
        </p>

        {error && <p className="text-[14px] text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={submitting || !labelFr.trim()}>
            {submitting ? '…' : t('dash.save')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            {t('dash.cancel')}
          </Button>
        </div>
      </form>
    </Panel>
  )
}

export default function Categories() {
  const { t, n } = useI18n()
  const { trades, tradeLabel, reload } = useTrades()

  const [usage, setUsage] = useState({})
  const [form, setForm] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadUsage = () => fetchTradeUsage().then(setUsage).catch(() => setUsage({}))

  useEffect(() => {
    loadUsage()
  }, [])

  const run = async (action, successMessage) => {
    setError('')
    setMessage('')
    try {
      await action()
      await reload()
      await loadUsage()
      if (successMessage) setMessage(successMessage)
    } catch (err) {
      setError(err?.code === '23503' ? t('admin.tradeInUse') : t('dash.actionError'))
    }
  }

  const iconBtn =
    'grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sand-300 bg-white text-ink-400 transition-colors disabled:opacity-30'

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button size="sm" onClick={() => { setForm(form && !form.trade ? null : {}); setMessage('') }}>
          <Plus className="h-4 w-4" />
          {t('admin.addTrade')}
        </Button>
      </div>

      {form && (
        <TradeForm
          key={form.trade?.id || 'new'}
          trade={form.trade}
          existingIds={trades.map((x) => x.id)}
          onSaved={async (msg) => {
            setForm(null)
            await reload()
            await loadUsage()
            setMessage(msg)
          }}
          onCancel={() => setForm(null)}
        />
      )}

      {message && <p className="mb-6 text-[14px] text-vert-700">{message}</p>}
      {error && <p className="mb-6 text-[14px] text-red-600">{error}</p>}

      <Panel title={t('dash.tradesAdmin')} bodyClass="">
        <div className="grid gap-px bg-sand-200 sm:grid-cols-2 xl:grid-cols-3">
          {trades.map((tr) => {
            const off = !tr.enabled
            const counts = usage[tr.id] || { workers: 0, jobs: 0 }
            const used = counts.workers + counts.jobs > 0
            const locked = tr.id === CORE_TRADE

            return (
              <div key={tr.id} className="bg-white p-5 transition-colors hover:bg-sand-50">
                <div className="flex items-center gap-3.5">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors ${
                      off ? 'bg-sand-100 text-ink-400' : 'bg-vert-50 text-vert-700'
                    }`}
                  >
                    <TradeIcon name={tr.icon} className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[15px] font-medium ${off ? 'text-ink-400' : 'text-ink'}`}>
                      {tradeLabel(tr.id)}
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-400">
                      {n(counts.workers)} {t('admin.usageWorkers')} · {n(counts.jobs)} {t('admin.usageJobs')} ·{' '}
                      {off ? t('dash.hidden') : t('dash.visible')}
                    </p>
                  </div>

                  <button
                    onClick={() => run(() => setTradeEnabled(tr.id, off))}
                    role="switch"
                    aria-checked={!off}
                    aria-label={tradeLabel(tr.id)}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      off ? 'bg-sand-300' : 'bg-vert-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                        off ? 'start-0.5' : 'start-[1.125rem]'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-3 flex gap-1.5">
                  <button
                    onClick={() => { setForm({ trade: tr }); setConfirmingId(null); setMessage('') }}
                    title={t('admin.editTrade')}
                    className={`${iconBtn} hover:border-vert-200 hover:text-vert-700`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmingId(confirmingId === tr.id ? null : tr.id)}
                    disabled={used || locked}
                    title={
                      locked ? t('admin.tradeCoreLocked') : used ? t('admin.tradeInUse') : t('admin.deleteTrade')
                    }
                    className={`${iconBtn} hover:border-ocre-500 hover:text-ocre-700`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {confirmingId === tr.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-s-2 border-ocre-500 bg-ocre-100/50 px-4 py-3">
                    <p className="flex-1 text-[13.5px] text-ocre-700">{t('admin.deleteTradeConfirm')}</p>
                    <button
                      onClick={() => {
                        setConfirmingId(null)
                        run(() => deleteTrade(tr.id), t('admin.tradeDeleted'))
                      }}
                      className="h-8 rounded-lg bg-ocre-700 px-3 text-[13.5px] font-medium text-white transition-colors hover:bg-ocre-500"
                    >
                      {t('dash.confirmDelete')}
                    </button>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="h-8 rounded-lg border border-sand-300 bg-white px-3 text-[13.5px] text-ink-600 transition-colors hover:text-ink"
                    >
                      {t('dash.cancel')}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Panel>
    </>
  )
}
