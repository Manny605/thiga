-- THIGA — portail admin : rôle admin, statut de compte, vérification d'identité
-- des employeurs (avec document), signalements, catégories de métiers.

-- ── profiles : rôle admin + statut de compte ───────────────────────────
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('worker', 'employer', 'admin'));

alter table public.profiles add column if not exists status text not null default 'active'
  check (status in ('active', 'pending', 'suspended'));

-- ── is_admin() : helper réutilisé par toutes les policies admin ───────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ── policies existantes : ajout d'un accès admin ───────────────────────
drop policy if exists "online jobs are public, employers see their own" on public.jobs;
create policy "online jobs are public, employers see their own"
  on public.jobs for select
  using (status = 'online' or employer_id = auth.uid() or public.is_admin());

drop policy if exists "employers update their own jobs" on public.jobs;
create policy "employers update their own jobs"
  on public.jobs for update
  using (employer_id = auth.uid() or public.is_admin())
  with check (employer_id = auth.uid() or public.is_admin());

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "workers update their own profile" on public.worker_profiles;
create policy "workers update their own profile"
  on public.worker_profiles for update
  using (auth.uid() = profile_id or public.is_admin())
  with check (auth.uid() = profile_id or public.is_admin());

drop policy if exists "employers update their own profile" on public.employer_profiles;
create policy "employers update their own profile"
  on public.employer_profiles for update
  using (auth.uid() = profile_id or public.is_admin())
  with check (auth.uid() = profile_id or public.is_admin());

-- ── verification_requests : soumission de document par l'employeur ────
create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles (id) on delete cascade,
  document_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id)
);

alter table public.verification_requests enable row level security;

create index verification_requests_employer_id_idx on public.verification_requests (employer_id);
create index verification_requests_status_idx on public.verification_requests (status);

create policy "employers see their own verification requests, admin sees all"
  on public.verification_requests for select
  using (employer_id = auth.uid() or public.is_admin());

create policy "employers submit their own verification requests"
  on public.verification_requests for insert
  with check (employer_id = auth.uid());

create policy "admin reviews verification requests"
  on public.verification_requests for update
  using (public.is_admin())
  with check (public.is_admin());

-- ── reports : signalements d'offres/profils ────────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('job', 'profile')),
  job_id uuid references public.jobs (id) on delete cascade,
  worker_id uuid references public.profiles (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason text not null check (reason in ('misleading', 'fake', 'salary')),
  severity text not null default 'medium' check (severity in ('high', 'medium', 'low')),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "authenticated users submit reports"
  on public.reports for insert
  with check (auth.uid() is not null and reporter_id = auth.uid());

-- Pas de lecture par le déclarant : seul l'admin traite les signalements.
create policy "admin reads reports"
  on public.reports for select
  using (public.is_admin());

create policy "admin closes reports"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());

-- ── trade_settings : activer/masquer un métier du catalogue public ────
create table public.trade_settings (
  trade text primary key check (
    trade in ('menage', 'nounou', 'chauffeur', 'cuisinier', 'electricien', 'plombier', 'jardinier', 'securite', 'autre')
  ),
  enabled boolean not null default true
);

alter table public.trade_settings enable row level security;

create policy "trade settings are publicly readable"
  on public.trade_settings for select
  using (true);

create policy "admin manages trade settings"
  on public.trade_settings for update
  using (public.is_admin())
  with check (public.is_admin());

insert into public.trade_settings (trade)
values ('menage'), ('nounou'), ('chauffeur'), ('cuisinier'), ('electricien'), ('plombier'), ('jardinier'), ('securite'), ('autre');

-- ── Storage : documents d'identité (bucket créé séparément via l'API) ─
-- Convention de chemin : identity-documents/<employer_id>/<fichier>.
create policy "employers upload own verification documents"
  on storage.objects for insert
  with check (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "employers and admin read verification documents"
  on storage.objects for select
  using (
    bucket_id = 'identity-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
