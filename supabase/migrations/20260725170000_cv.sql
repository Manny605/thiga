-- THIGA — CV des travailleurs.
--
-- Le CV vit sur le profil (téléversé une fois) et se rattache à chaque
-- candidature. La candidature garde le chemin du fichier envoyé ce jour-là :
-- si le travailleur remplace son CV plus tard, l'employeur continue de voir
-- celui qu'il a réellement reçu.

-- ── bucket privé ──────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cv', 'cv', false, 5242880, array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- ── colonnes ──────────────────────────────────────────────────────────
alter table public.worker_profiles add column if not exists cv_path text;
alter table public.worker_profiles add column if not exists cv_name text;
alter table public.worker_profiles add column if not exists cv_uploaded_at timestamptz;

alter table public.applications add column if not exists cv_path text;
alter table public.applications add column if not exists cv_name text;

-- ── un CV appartient à celui qui le présente ─────────────────────────
-- Sans ce contrôle, un travailleur pourrait déposer une candidature pointant
-- vers le fichier d'un autre : la policy de lecture ci-dessous l'ouvrirait
-- alors à l'employeur. La convention de chemin est `<worker_id>/<fichier>`.

create or replace function public.guard_application_cv()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.cv_path is not null and split_part(new.cv_path, '/', 1) <> new.worker_id::text then
    raise exception 'cv_path must belong to the applicant';
  end if;
  return new;
end;
$$;

drop trigger if exists applications_guard_cv on public.applications;
create trigger applications_guard_cv
  before insert or update on public.applications
  for each row execute function public.guard_application_cv();

-- Même règle sur le profil, et on conserve les verrous posés précédemment
-- (verified et refs réservés à l'admin).
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

  if new.cv_path is not null and split_part(new.cv_path, '/', 1) <> new.profile_id::text then
    raise exception 'cv_path must belong to the worker';
  end if;

  return new;
end;
$$;

-- ── stockage : dépôt, remplacement, suppression par le propriétaire ───

drop policy if exists "workers upload their own cv" on storage.objects;
create policy "workers upload their own cv"
  on storage.objects for insert
  with check (
    bucket_id = 'cv'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "workers update their own cv" on storage.objects;
create policy "workers update their own cv"
  on storage.objects for update
  using (bucket_id = 'cv' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cv' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "workers delete their own cv" on storage.objects;
create policy "workers delete their own cv"
  on storage.objects for delete
  using (bucket_id = 'cv' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── stockage : lecture ───────────────────────────────────────────────
-- Le travailleur et l'admin ; plus tout employeur ayant reçu une candidature
-- qui porte ce fichier. Un employeur ne voit donc que les CV qu'on lui a
-- effectivement envoyés, jamais le dépôt d'un travailleur.

drop policy if exists "workers and admin read cv" on storage.objects;
create policy "workers and admin read cv"
  on storage.objects for select
  using (
    bucket_id = 'cv'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists "employers read cv attached to their jobs" on storage.objects;
create policy "employers read cv attached to their jobs"
  on storage.objects for select
  using (
    bucket_id = 'cv'
    and exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.cv_path = storage.objects.name
        and j.employer_id = auth.uid()
    )
  );
