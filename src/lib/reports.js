import { supabase } from './supabaseClient'

export async function submitReport({ kind, jobId, workerId, reporterId, reason, details = '' }) {
  const { error } = await supabase.from('reports').insert({
    kind,
    job_id: kind === 'job' ? jobId : null,
    worker_id: kind === 'profile' ? workerId : null,
    reporter_id: reporterId,
    reason,
    details: details.trim() || null,
  })
  if (error) throw error
}
