-- THIGA — recherche par mots-clés côté base.
--
-- Les listes chargeaient toutes les lignes puis filtraient dans le navigateur.
-- Chaque annonce et chaque profil porte désormais un texte de recherche
-- normalisé (minuscules, sans accents), interrogé par `ilike` et accéléré par
-- un index trigramme. Le navigateur applique la même normalisation à la saisie.

create extension if not exists pg_trgm with schema extensions;

/** Minuscules sans accents latins ; l'arabe passe tel quel. */
create or replace function public.search_normalize(p text)
returns text
language sql
immutable
as $$
  select lower(translate(
    coalesce(p, ''),
    'ÀÁÂÄÃÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜàáâäãçèéêëìíîïñòóôöõùúûü',
    'AAAAACEEEEIIIINOOOOOUUUUaaaaaceeeeiiiinooooouuuu'
  ));
$$;

-- ── annonces ──────────────────────────────────────────────────────────
alter table public.jobs add column if not exists search_text text;

create or replace function public.job_search_text()
returns trigger
language plpgsql
as $$
begin
  new.search_text := public.search_normalize(concat_ws(' ',
    new.title, new.description, new.trade, new.city, new.district,
    array_to_string(new.duties, ' '), array_to_string(new.reqs, ' ')
  ));
  return new;
end;
$$;

drop trigger if exists jobs_search_text on public.jobs;
create trigger jobs_search_text
  before insert or update of title, description, trade, city, district, duties, reqs on public.jobs
  for each row execute function public.job_search_text();

update public.jobs set title = title;

create index if not exists jobs_search_text_trgm
  on public.jobs using gin (search_text extensions.gin_trgm_ops);

-- ── profils travailleurs ──────────────────────────────────────────────
-- Le nom vit dans `profiles` : un second trigger recalcule le texte quand
-- il change.
alter table public.worker_profiles add column if not exists search_text text;

create or replace function public.worker_search_text()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.search_text := public.search_normalize(concat_ws(' ',
    (select full_name from public.profiles where id = new.profile_id),
    new.trade, new.district, new.bio,
    array_to_string(new.skills, ' '), array_to_string(new.langs, ' ')
  ));
  return new;
end;
$$;

drop trigger if exists worker_profiles_search_text on public.worker_profiles;
create trigger worker_profiles_search_text
  before insert or update of trade, district, bio, skills, langs, search_text on public.worker_profiles
  for each row execute function public.worker_search_text();

create or replace function public.profile_name_to_search()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.full_name is distinct from old.full_name then
    -- Écrire `search_text` suffit à déclencher le recalcul ci-dessus.
    update public.worker_profiles set search_text = null where profile_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_name_to_search on public.profiles;
create trigger profiles_name_to_search
  after update of full_name on public.profiles
  for each row execute function public.profile_name_to_search();

update public.worker_profiles set search_text = null;

create index if not exists worker_profiles_search_text_trgm
  on public.worker_profiles using gin (search_text extensions.gin_trgm_ops);

notify pgrst, 'reload schema';
