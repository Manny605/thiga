import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useI18n } from '../../../i18n/I18nProvider'
import { useAuth } from '../../../auth/AuthProvider'
import { useTrades } from '../../../trades/TradesProvider'
import { createJob, updateJob } from '../../../lib/employerDash'
import { isExpired, todayUtc } from '../../../lib/deadline'
import { CITIES, CONTRACTS } from '../../../data/mock'
import Panel from '../../../components/dashboard/Panel'
import StatusPill from '../../../components/dashboard/StatusPill'
import Button from '../../../components/ui/Button'
import { Input, Select, Textarea } from '../../../components/ui/Field'
import { useEmployerDash } from './EmployerLayout'

function JobForm({ employerId, job, onDone, onCancel }) {
  const { t } = useI18n()
  const { visibleTrades, tradeLabel } = useTrades()
  const editing = !!job

  const [title, setTitle] = useState(job?.title || '')
  const [trade, setTrade] = useState(job?.trade || '')
  const [city, setCity] = useState(job?.city || '')
  const [district, setDistrict] = useState(job?.district || '')
  const [contract, setContract] = useState(job?.contract || '')
  const [salary, setSalary] = useState(job?.salary ?? '')
  const [unit, setUnit] = useState(job?.unit || 'perMonth')
  const [description, setDescription] = useState(job?.description || '')
  const [duties, setDuties] = useState((job?.duties || []).join('\n'))
  const [reqs, setReqs] = useState((job?.reqs || []).join('\n'))
  const [deadline, setDeadline] = useState(job?.deadline || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const payload = {
      title: title.trim(),
      trade,
      city,
      district: district.trim(),
      contract,
      salary: salary !== '' ? Number(salary) : null,
      unit,
      description: description.trim(),
      duties: duties.split('\n').map((s) => s.trim()).filter(Boolean),
      reqs: reqs.split('\n').map((s) => s.trim()).filter(Boolean),
      deadline: deadline || null,
    }
    try {
      if (editing) {
        const saved = await updateJob(job.id, payload)
        onDone(saved.status === 'pending' && job.status === 'online' ? t('dash.jobBackToReview') : t('dash.jobSaved'))
      } else {
        await createJob(employerId, payload)
        onDone(t('dash.jobCreated'))
      }
    } catch {
      setError(editing ? t('dash.jobUpdateError') : t('dash.jobCreateError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel title={editing ? t('dash.editJob') : t('dash.newJob')} className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t('dash.title')} value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label={t('common.trade')} value={trade} onChange={(e) => setTrade(e.target.value)} required>
            <option value="" disabled>{t('common.allTrades')}</option>
            {visibleTrades.map((tr) => (
              <option key={tr.id} value={tr.id}>{tradeLabel(tr.id)}</option>
            ))}
          </Select>
          <Select label={t('common.city')} value={city} onChange={(e) => setCity(e.target.value)} required>
            <option value="" disabled>{t('common.allCities')}</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{t(`cities.${c}`)}</option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('dash.districtLabel')} value={district} onChange={(e) => setDistrict(e.target.value)} />
          <Select label={t('jobs.type')} value={contract} onChange={(e) => setContract(e.target.value)} required>
            <option value="" disabled>{t('jobs.allTypes')}</option>
            {CONTRACTS.map((c) => (
              <option key={c} value={c}>{t(`contracts.${c}`)}</option>
            ))}
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('dash.salaryLabel')}
            type="number"
            min="0"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            required
          />
          <Select label={t('common.rate')} value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="perMonth">{t('common.perMonth')}</option>
            <option value="perDay">{t('common.perDay')}</option>
          </Select>
        </div>

        <Textarea label={t('dash.descriptionLabel')} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <Textarea label={t('dash.dutiesLabel')} rows={3} value={duties} onChange={(e) => setDuties(e.target.value)} />
        <Textarea label={t('dash.reqsLabel')} rows={3} value={reqs} onChange={(e) => setReqs(e.target.value)} />

        <div className="max-w-xs">
          <Input
            label={t('dash.deadlineLabel')}
            type="date"
            min={job?.deadline && job.deadline < todayUtc() ? job.deadline : todayUtc()}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-400">{t('dash.deadlineHint')}</p>
        </div>

        {editing && job.status === 'online' && (
          <p className="text-[13.5px] text-ink-400">{t('dash.editOnlineHint')}</p>
        )}
        {error && <p className="text-[14px] text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? '…' : editing ? t('dash.save') : t('dash.publish')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            {t('dash.cancel')}
          </Button>
        </div>
      </form>
    </Panel>
  )
}

export default function MyJobs() {
  const { t, n, d } = useI18n()
  const { user } = useAuth()
  const { jobs, reload, closeJob, republishJob, removeJob } = useEmployerDash()

  const [form, setForm] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const run = async (action) => {
    setError('')
    setMessage('')
    try {
      await action()
    } catch {
      setError(t('dash.actionError'))
    }
  }

  const iconBtn =
    'grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sand-300 bg-white text-ink-400 transition-colors'

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button size="sm" onClick={() => { setForm(form && !form.job ? null : {}); setMessage('') }}>
          <Plus className="h-4 w-4" />
          {t('dash.newJob')}
        </Button>
      </div>

      {form && user && (
        <JobForm
          key={form.job?.id || 'new'}
          employerId={user.id}
          job={form.job}
          onDone={(msg) => { setForm(null); setMessage(msg); reload() }}
          onCancel={() => setForm(null)}
        />
      )}

      {message && <p className="mb-6 text-[14px] text-vert-700">{message}</p>}
      {error && <p className="mb-6 text-[14px] text-red-600">{error}</p>}

      <Panel title={t('dash.myJobs')} bodyClass="">
        {jobs.length === 0 ? (
          <p className="px-6 py-10 text-center text-[14.5px] text-ink-400">{t('common.empty')}</p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {jobs.map((j) => (
              <li key={j.id} className="px-6 py-4 transition-colors hover:bg-sand-50">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/offres/${j.id}`}
                      className="block truncate text-[15px] font-medium text-ink transition-colors hover:text-vert-700"
                    >
                      {j.title}
                    </Link>
                    <p className="mt-1 text-[13px] text-ink-400">
                      {t(`cities.${j.city}`)} · {n(j.appsCount)} {t('dash.apps').toLowerCase()}
                      {j.deadline && !isExpired(j.deadline) && <> · {t('common.deadlineUntil')} {d(j.deadline)}</>}
                    </p>
                  </div>

                  {j.status === 'online' && isExpired(j.deadline) ? (
                    <StatusPill status="closed">{t('jobStatus.expired')}</StatusPill>
                  ) : (
                    <StatusPill status={j.status}>{t(`jobStatus.${j.status}`)}</StatusPill>
                  )}

                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => { setForm({ job: j }); setConfirmingId(null); setMessage('') }}
                      title={t('dash.editJob')}
                      className={`${iconBtn} hover:border-vert-200 hover:text-vert-700`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {j.status === 'closed' ? (
                      <button
                        onClick={() => run(() => republishJob(j.id))}
                        title={t('dash.republish')}
                        className={`${iconBtn} hover:border-vert-200 hover:text-vert-700`}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => run(() => closeJob(j.id))}
                        title={t('dash.close')}
                        className={`${iconBtn} hover:border-ocre-500 hover:text-ocre-700`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setConfirmingId(confirmingId === j.id ? null : j.id)}
                      title={t('dash.deleteJob')}
                      className={`${iconBtn} hover:border-ocre-500 hover:text-ocre-700`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {confirmingId === j.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-s-2 border-ocre-500 bg-ocre-100/50 px-4 py-3">
                    <p className="flex-1 text-[13.5px] text-ocre-700">
                      {t('dash.deleteJobConfirm')}
                    </p>
                    <button
                      onClick={() => { setConfirmingId(null); run(() => removeJob(j.id)) }}
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
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}
