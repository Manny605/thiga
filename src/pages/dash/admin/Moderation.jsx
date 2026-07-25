import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ExternalLink, FileText, Tags, Users2, X } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { getVerificationDocumentUrl } from '../../../lib/admin'
import Panel from '../../../components/dashboard/Panel'
import { useAdmin } from './AdminLayout'

const TABS = [
  { id: 'all', label: 'common.filters' },
  { id: 'job', label: 'admin.tabJobs' },
  { id: 'profile', label: 'admin.tabProfiles' },
]

export default function Moderation() {
  const { t, n, d } = useI18n()
  const { queue, resolveQueue } = useAdmin()
  const [tab, setTab] = useState('all')
  const [error, setError] = useState('')

  const list = queue.filter((q) => tab === 'all' || q.kind === tab)

  const resolve = async (id, decision) => {
    setError('')
    try {
      await resolveQueue(id, decision)
    } catch {
      setError(t('dash.actionError'))
    }
  }

  const viewDocument = async (path) => {
    try {
      const url = await getVerificationDocumentUrl(path)
      window.open(url, '_blank', 'noopener')
    } catch {
      // Pas de gestion d'erreur dédiée pour cette action secondaire.
    }
  }

  return (
    <>
      {/* Onglets */}
      <div className="flex gap-1 border-b border-sand-200/70">
        {TABS.map((x) => {
          const count = x.id === 'all' ? queue.length : queue.filter((q) => q.kind === x.id).length
          const on = tab === x.id
          return (
            <button
              key={x.id}
              onClick={() => setTab(x.id)}
              className={`relative -mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-[13.5px] transition-colors ${
                on ? 'border-vert-700 text-vert-700' : 'border-transparent text-ink-400 hover:text-ink'
              }`}
            >
              {x.id === 'all' ? t('dash.queue') : t(x.label)}
              <span
                className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[10.5px] ${
                  on ? 'bg-vert-700 text-sand-50' : 'bg-sand-200 text-ink-600'
                }`}
              >
                {n(count)}
              </span>
            </button>
          )
        })}
      </div>

      {error && <p className="mt-6 text-[13px] text-red-600">{error}</p>}

      <Panel bodyClass="" className="mt-6">
        {list.length === 0 ? (
          <p className="px-6 py-16 text-center text-[13.5px] text-ink-400">{t('dash.noQueue')}</p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {list.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-4 px-6 py-4 transition-colors hover:bg-sand-50">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sand-100 text-ink-600">
                  {q.kind === 'job' ? (
                    <Tags className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Users2 className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{q.label}</p>
                  <p className="mt-1 truncate text-[12px] text-ink-400">
                    {t(`dash.${q.kind === 'job' ? 'job' : 'profile'}`)} ·{' '}
                    {q.kind === 'job' ? q.by : q.by && t(`cities.${q.by}`)} · {d(q.date)}
                  </p>
                </div>

                {q.kind === 'job' ? (
                  <Link
                    to={`/offres/${q.ref}`}
                    className="flex items-center gap-1.5 text-[12.5px] text-ink-600 transition-colors hover:text-vert-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('dash.inspect')}
                  </Link>
                ) : (
                  <button
                    onClick={() => viewDocument(q.documentPath)}
                    className="flex items-center gap-1.5 text-[12.5px] text-ink-600 transition-colors hover:text-vert-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {t('admin.viewDocument')}
                  </button>
                )}

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => resolve(q.id, 'approve')}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-vert-100 bg-vert-50 px-3 text-[12.5px] font-medium text-vert-700 transition-colors hover:bg-vert-700 hover:text-sand-50"
                  >
                    <Check className="h-4 w-4" />
                    {t('dash.approve')}
                  </button>
                  <button
                    onClick={() => resolve(q.id, 'reject')}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-sand-300 bg-white px-3 text-[12.5px] font-medium text-ink-600 transition-colors hover:border-ocre-500 hover:text-ocre-700"
                  >
                    <X className="h-4 w-4" />
                    {t('dash.reject')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}
