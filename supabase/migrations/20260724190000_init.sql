  -- THIGA — schéma initial : profils, offres, candidatures.
  -- Périmètre : auth + pages publiques Offres/Travailleurs.
  -- Les tableaux de bord et l'admin restent sur données fictives pour l'instant.

  create extension if not exists pgcrypto;

  -- ── profiles ──────────────────────────────────────────────────────────
  -- Aucune donnée sensible ici : lecture publique nécessaire pour les listes
  -- publiques (offres, travailleurs). Le téléphone vit à part, dans
  -- private_contact, qui n'est jamais lisible publiquement.
  create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    role text not null check (role in ('worker', 'employer')),
    full_name text not null,
    city text,
    created_at timestamptz not null default now()
  );

  alter table public.profiles enable row level security;

  create policy "profiles are publicly readable"
    on public.profiles for select
    using (true);

  create policy "users update their own profile"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

  -- ── private_contact ──────────────────────────────────────────────────
  -- Table séparée (plutôt qu'une colonne masquée) pour que le téléphone ne
  -- soit *jamais* accessible via une requête publique, même directe à l'API.
  create table public.private_contact (
    profile_id uuid primary key references public.profiles (id) on delete cascade,
    phone text
  );

  alter table public.private_contact enable row level security;

  create policy "users read their own contact info"
    on public.private_contact for select
    using (auth.uid() = profile_id);

  create policy "users update their own contact info"
    on public.private_contact for update
    using (auth.uid() = profile_id)
    with check (auth.uid() = profile_id);

  -- ── worker_profiles ──────────────────────────────────────────────────
  create table public.worker_profiles (
    profile_id uuid primary key references public.profiles (id) on delete cascade,
    trade text not null check (
      trade in ('menage', 'nounou', 'chauffeur', 'cuisinier', 'electricien', 'plombier', 'jardinier', 'securite', 'autre')
    ),
    district text,
    years integer not null default 0,
    availability text not null default 'now' check (availability in ('now', 'soon', 'busy')),
    rate numeric,
    unit text check (unit in ('perMonth', 'perDay')),
    langs text[] not null default '{}',
    skills text[] not null default '{}',
    bio text,
    verified boolean not null default false,
    refs integer not null default 0,
    last_active timestamptz not null default now()
  );

  alter table public.worker_profiles enable row level security;

  create policy "worker profiles are publicly readable"
    on public.worker_profiles for select
    using (true);

  create policy "workers update their own profile"
    on public.worker_profiles for update
    using (auth.uid() = profile_id)
    with check (auth.uid() = profile_id);

  -- ── employer_profiles ────────────────────────────────────────────────
  create table public.employer_profiles (
    profile_id uuid primary key references public.profiles (id) on delete cascade,
    employer_type text not null default 'Particulier' check (employer_type in ('Particulier', 'Entreprise')),
    verified boolean not null default false
  );

  alter table public.employer_profiles enable row level security;

  create policy "employer profiles are publicly readable"
    on public.employer_profiles for select
    using (true);

  create policy "employers update their own profile"
    on public.employer_profiles for update
    using (auth.uid() = profile_id)
    with check (auth.uid() = profile_id);

  -- ── jobs ──────────────────────────────────────────────────────────────
  create table public.jobs (
    id uuid primary key default gen_random_uuid(),
    employer_id uuid not null references public.profiles (id) on delete cascade,
    title text not null,
    trade text not null check (
      trade in ('menage', 'nounou', 'chauffeur', 'cuisinier', 'electricien', 'plombier', 'jardinier', 'securite', 'autre')
    ),
    city text not null,
    district text,
    contract text check (contract in ('full', 'part', 'daily', 'mission')),
    salary numeric,
    unit text check (unit in ('perMonth', 'perDay')),
    status text not null default 'pending' check (status in ('pending', 'online', 'closed')),
    urgent boolean not null default false,
    verified boolean not null default false,
    description text,
    duties text[] not null default '{}',
    reqs text[] not null default '{}',
    created_at timestamptz not null default now()
  );

  alter table public.jobs enable row level security;

  create index jobs_status_idx on public.jobs (status);
  create index jobs_employer_id_idx on public.jobs (employer_id);

  create policy "online jobs are public, employers see their own"
    on public.jobs for select
    using (status = 'online' or employer_id = auth.uid());

  create policy "employers insert their own jobs"
    on public.jobs for insert
    with check (employer_id = auth.uid());

  create policy "employers update their own jobs"
    on public.jobs for update
    using (employer_id = auth.uid())
    with check (employer_id = auth.uid());

  -- ── applications ──────────────────────────────────────────────────────
  create table public.applications (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references public.jobs (id) on delete cascade,
    worker_id uuid not null references public.profiles (id) on delete cascade,
    message text,
    status text not null default 'new' check (status in ('new', 'seen', 'shortlisted', 'rejected')),
    created_at timestamptz not null default now(),
    unique (job_id, worker_id)
  );

  alter table public.applications enable row level security;

  create index applications_job_id_idx on public.applications (job_id);
  create index applications_worker_id_idx on public.applications (worker_id);

  create policy "workers insert their own applications"
    on public.applications for insert
    with check (worker_id = auth.uid());

  create policy "workers see their own applications, employers see theirs"
    on public.applications for select
    using (
      worker_id = auth.uid()
      or exists (select 1 from public.jobs j where j.id = applications.job_id and j.employer_id = auth.uid())
    );

  create policy "employers update status of applications to their jobs"
    on public.applications for update
    using (exists (select 1 from public.jobs j where j.id = applications.job_id and j.employer_id = auth.uid()))
    with check (exists (select 1 from public.jobs j where j.id = applications.job_id and j.employer_id = auth.uid()));

  -- ── trigger : peuple profiles/*_profiles/private_contact au signup ────
  -- SECURITY DEFINER + propriétaire des tables => contourne RLS pour cet insert précis.
  create function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    insert into public.profiles (id, role, full_name, city)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'role', 'worker'),
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      new.raw_user_meta_data ->> 'city'
    );

    if coalesce(new.raw_user_meta_data ->> 'role', 'worker') = 'worker' then
      insert into public.worker_profiles (profile_id, trade)
      values (new.id, coalesce(new.raw_user_meta_data ->> 'trade', 'autre'));
    else
      insert into public.employer_profiles (profile_id)
      values (new.id);
    end if;

    if new.raw_user_meta_data ->> 'phone' is not null then
      insert into public.private_contact (profile_id, phone)
      values (new.id, new.raw_user_meta_data ->> 'phone');
    end if;

    return new;
  end;
  $$;

  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
