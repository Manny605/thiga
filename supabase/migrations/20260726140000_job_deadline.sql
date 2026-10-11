-- THIGA — date limite facultative sur les annonces.
--
-- L'employeur peut fixer le dernier jour où l'annonce accepte des candidatures.
-- Passé ce jour, elle disparaît du site public et refuse toute nouvelle
-- candidature ; elle reste visible pour son auteur et pour l'admin.
-- Les dates sont comparées en UTC, qui est l'heure légale en Mauritanie.
-- Changer la date d'une annonce en ligne ne la renvoie pas en modération :
-- `guard_job_columns` ne surveille que le fond de l'annonce.

alter table public.jobs add column if not exists deadline date;

alter table public.jobs drop constraint if exists jobs_deadline_after_creation;
alter table public.jobs add constraint jobs_deadline_after_creation
  check (deadline is null or deadline >= (created_at at time zone 'utc')::date);

/** L'annonce accepte-t-elle encore des candidatures ? */
create or replace function public.job_is_open(j public.jobs)
returns boolean
language sql
stable
as $$
  select j.status = 'online' and (j.deadline is null or j.deadline >= (now() at time zone 'utc')::date);
$$;

/**
 * Le compte connecté a-t-il postulé à cette annonce ?
 * SECURITY DEFINER : lire `applications` depuis la policy de `jobs` sous RLS
 * bouclerait, la policy de lecture d'`applications` interrogeant `jobs`.
 */
create or replace function public.has_applied(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.applications
    where job_id = p_job_id and worker_id = auth.uid()
  );
$$;

-- ── lecture : en ligne, non expirée, employeur actif ──────────────────
-- Un candidat garde l'accès à l'annonce à laquelle il a postulé, même expirée
-- ou clôturée : sinon sa liste de candidatures perdrait le titre de l'offre.
drop policy if exists "online jobs are public, employers see their own" on public.jobs;
create policy "online jobs are public, employers see their own"
  on public.jobs for select
  using (
    employer_id = auth.uid()
    or public.is_admin()
    or public.has_applied(id)
    or (
      public.job_is_open(jobs)
      and exists (
        select 1 from public.profiles p
        where p.id = jobs.employer_id and p.status = 'active'
      )
    )
  );

-- ── candidature : uniquement sur une annonce ouverte ──────────────────
drop policy if exists "workers insert their own applications" on public.applications;
create policy "workers insert their own applications"
  on public.applications for insert
  with check (
    worker_id = auth.uid()
    and public.is_active()
    and exists (
      select 1 from public.jobs j
      where j.id = applications.job_id and public.job_is_open(j)
    )
  );

notify pgrst, 'reload schema';
