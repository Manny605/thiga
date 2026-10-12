-- THIGA — signalements : motifs, gravité réelle, détail, décision tracée.
--
-- Avant : trois motifs, aucune précision possible, une gravité jamais
-- renseignée (tout valait « moyenne »), et un signalement classé ou une
-- annonce supprimée ne laissaient aucune trace de la décision prise.

-- ── motifs ────────────────────────────────────────────────────────────
alter table public.reports drop constraint if exists reports_reason_check;
alter table public.reports add constraint reports_reason_check
  check (reason in ('misleading', 'fake', 'salary', 'payment', 'harassment', 'inappropriate', 'other'));

-- ── précision du déclarant ────────────────────────────────────────────
alter table public.reports add column if not exists details text;
alter table public.reports drop constraint if exists reports_details_length;
alter table public.reports add constraint reports_details_length
  check (details is null or char_length(details) <= 1000);

-- ── décision de l'admin ───────────────────────────────────────────────
alter table public.reports add column if not exists resolution text;
alter table public.reports drop constraint if exists reports_resolution_check;
alter table public.reports add constraint reports_resolution_check
  check (resolution is null or resolution in ('dismissed', 'content_removed', 'account_suspended'));
alter table public.reports add column if not exists admin_note text;
alter table public.reports add column if not exists resolved_at timestamptz;
alter table public.reports add column if not exists resolved_by uuid references public.profiles (id) on delete set null;

-- ── gravité déduite du motif, jamais choisie par le déclarant ─────────
-- Demander de l'argent ou harceler expose une personne : priorité haute.
create or replace function public.report_severity()
returns trigger
language plpgsql
as $$
begin
  new.severity := case
    when new.reason in ('payment', 'harassment') then 'high'
    when new.reason in ('fake', 'misleading', 'inappropriate') then 'medium'
    else 'low'
  end;
  return new;
end;
$$;

drop trigger if exists reports_severity on public.reports;
create trigger reports_severity
  before insert or update of reason on public.reports
  for each row execute function public.report_severity();

update public.reports set reason = reason;

-- ── un signalement ouvert par personne et par cible ───────────────────
-- Les doublons existants (même déclarant, même cible) sont d'abord classés :
-- on garde le plus récent ouvert, les autres sont tracés comme doublons.
update public.reports r
set status = 'closed',
    resolution = 'dismissed',
    admin_note = 'Doublon : même déclarant, même cible (classé automatiquement).',
    resolved_at = now()
where r.status = 'open'
  and r.reporter_id is not null
  and exists (
    select 1 from public.reports newer
    where newer.status = 'open'
      and newer.reporter_id = r.reporter_id
      and newer.kind = r.kind
      and coalesce(newer.job_id, newer.worker_id) = coalesce(r.job_id, r.worker_id)
      and (newer.created_at, newer.id) > (r.created_at, r.id)
  );

create unique index if not exists reports_one_open_per_reporter
  on public.reports (reporter_id, kind, coalesce(job_id, worker_id))
  where status = 'open' and reporter_id is not null;

notify pgrst, 'reload schema';
