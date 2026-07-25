-- THIGA — audit CRUD : verrouillage des champs privilégiés, suppressions,
-- et invisibilité publique des comptes suspendus.
--
-- Les policies « update his own row » d'origine autorisaient l'écriture de
-- *toutes* les colonnes de la ligne. Or certaines colonnes ne sont pas au
-- propriétaire : role, status, verified, refs, jobs.status. Un simple appel
-- REST authentifié suffisait donc à se nommer admin ou à se certifier.
-- Postgres n'ayant pas de granularité colonne dans les policies, on garde les
-- policies telles quelles et on ajoute des triggers BEFORE UPDATE qui rejettent
-- la modification des colonnes privilégiées hors admin.

-- ── helpers ───────────────────────────────────────────────────────────

/**
 * Écriture privilégiée autorisée ? Admin, ou requête sans JWT.
 *
 * « Sans JWT » = service_role (scripts d'administration, seed), qui court-
 * circuite RLS de toute façon. Ce n'est pas une porte dérobée pour `anon` :
 * une requête anonyme n'atteint jamais ces triggers, les policies UPDATE
 * exigeant toutes `auth.uid()`.
 */
create or replace function public.is_privileged()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is null or public.is_admin();
$$;

/** Le compte connecté est-il actif ? (suspendu => plus de création). */
create or replace function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and status = 'active'
  );
$$;

-- ── profiles : role et status réservés à l'admin ──────────────────────

create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_privileged() then
    if new.role is distinct from old.role then
      raise exception 'role is not self-assignable';
    end if;
    if new.status is distinct from old.status then
      raise exception 'status is not self-assignable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_columns on public.profiles;
create trigger profiles_guard_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- ── worker_profiles : verified et refs réservés à l'admin ─────────────

create or replace function public.guard_worker_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_privileged() then
    if new.verified is distinct from old.verified then
      raise exception 'verified is not self-assignable';
    end if;
    if new.refs is distinct from old.refs then
      raise exception 'refs is not self-assignable';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists worker_profiles_guard_columns on public.worker_profiles;
create trigger worker_profiles_guard_columns
  before update on public.worker_profiles
  for each row execute function public.guard_worker_profile_columns();

-- ── employer_profiles : verified réservé à l'admin ────────────────────

create or replace function public.guard_employer_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_privileged() and new.verified is distinct from old.verified then
    raise exception 'verified is not self-assignable';
  end if;
  return new;
end;
$$;

drop trigger if exists employer_profiles_guard_columns on public.employer_profiles;
create trigger employer_profiles_guard_columns
  before update on public.employer_profiles
  for each row execute function public.guard_employer_profile_columns();

-- ── jobs : mise en ligne et certification réservées à l'admin ─────────
-- L'employeur peut fermer (closed) ou remettre en file d'attente (pending).
-- Il ne peut pas publier lui-même : sinon la file de modération se contourne.
-- Et modifier le fond d'une annonce déjà en ligne la renvoie en modération,
-- sans quoi il suffirait de faire valider une annonce anodine puis de la
-- réécrire.

create or replace function public.guard_job_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged() then
    return new;
  end if;

  if new.verified is distinct from old.verified then
    raise exception 'verified is not self-assignable';
  end if;

  if new.status is distinct from old.status and new.status not in ('pending', 'closed') then
    raise exception 'only an admin can publish a job';
  end if;

  if old.status = 'online' and new.status = 'online' and (
    new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.trade is distinct from old.trade
    or new.city is distinct from old.city
    or new.district is distinct from old.district
    or new.contract is distinct from old.contract
    or new.salary is distinct from old.salary
    or new.unit is distinct from old.unit
    or new.duties is distinct from old.duties
    or new.reqs is distinct from old.reqs
  ) then
    new.status := 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_guard_columns on public.jobs;
create trigger jobs_guard_columns
  before update on public.jobs
  for each row execute function public.guard_job_columns();

-- ── signup : le rôle vient de l'utilisateur, donc il n'est pas fiable ─
-- `signUp(..., { data })` écrit tel quel dans raw_user_meta_data : sans
-- filtrage, s'inscrire avec role='admin' donnait un compte admin.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'worker');
  v_trade text := coalesce(new.raw_user_meta_data ->> 'trade', 'autre');
begin
  if v_role not in ('worker', 'employer') then
    v_role := 'worker';
  end if;

  if v_trade not in (
    'menage', 'nounou', 'chauffeur', 'cuisinier', 'electricien',
    'plombier', 'jardinier', 'securite', 'autre'
  ) then
    v_trade := 'autre';
  end if;

  insert into public.profiles (id, role, full_name, city)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'city'
  );

  if v_role = 'worker' then
    insert into public.worker_profiles (profile_id, trade) values (new.id, v_trade);
  else
    insert into public.employer_profiles (profile_id) values (new.id);
  end if;

  if new.raw_user_meta_data ->> 'phone' is not null then
    insert into public.private_contact (profile_id, phone)
    values (new.id, new.raw_user_meta_data ->> 'phone');
  end if;

  return new;
end;
$$;

-- ── suppressions ──────────────────────────────────────────────────────
-- Aucune policy DELETE n'existait : ni l'employeur ni le travailleur ne
-- pouvaient retirer ce qu'ils avaient créé. Les FK sont en `on delete
-- cascade`, donc supprimer une offre retire ses candidatures (pas d'orphelin).

drop policy if exists "employers delete their own jobs" on public.jobs;
create policy "employers delete their own jobs"
  on public.jobs for delete
  using (employer_id = auth.uid() or public.is_admin());

drop policy if exists "workers withdraw their own applications" on public.applications;
create policy "workers withdraw their own applications"
  on public.applications for delete
  using (worker_id = auth.uid() or public.is_admin());

-- ── création interdite aux comptes suspendus ──────────────────────────

drop policy if exists "employers insert their own jobs" on public.jobs;
create policy "employers insert their own jobs"
  on public.jobs for insert
  with check (employer_id = auth.uid() and public.is_active());

drop policy if exists "workers insert their own applications" on public.applications;
create policy "workers insert their own applications"
  on public.applications for insert
  with check (worker_id = auth.uid() and public.is_active());

-- ── un compte suspendu disparaît des listes publiques ─────────────────
-- Il reste visible pour lui-même et pour l'admin, sinon son propre tableau de
-- bord se viderait et la modération perdrait sa cible.

drop policy if exists "worker profiles are publicly readable" on public.worker_profiles;
drop policy if exists "active worker profiles are publicly readable" on public.worker_profiles;
create policy "active worker profiles are publicly readable"
  on public.worker_profiles for select
  using (
    profile_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.profiles p
      where p.id = worker_profiles.profile_id and p.status = 'active'
    )
  );

drop policy if exists "online jobs are public, employers see their own" on public.jobs;
create policy "online jobs are public, employers see their own"
  on public.jobs for select
  using (
    employer_id = auth.uid()
    or public.is_admin()
    or (
      status = 'online'
      and exists (
        select 1 from public.profiles p
        where p.id = jobs.employer_id and p.status = 'active'
      )
    )
  );
