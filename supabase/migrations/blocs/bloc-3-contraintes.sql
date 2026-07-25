-- BLOC 3/5 — la liste fermée (CHECK) devient une table ouverte (clé étrangère).
alter table public.trade_settings drop constraint if exists trade_settings_trade_check;
alter table public.trade_settings drop constraint if exists trade_settings_trade_slug;
alter table public.trade_settings add constraint trade_settings_trade_slug
  check (trade ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.jobs drop constraint if exists jobs_trade_check;
alter table public.jobs drop constraint if exists jobs_trade_fkey;
alter table public.jobs add constraint jobs_trade_fkey
  foreign key (trade) references public.trade_settings (trade)
  on update cascade on delete restrict;

alter table public.worker_profiles drop constraint if exists worker_profiles_trade_check;
alter table public.worker_profiles drop constraint if exists worker_profiles_trade_fkey;
alter table public.worker_profiles add constraint worker_profiles_trade_fkey
  foreign key (trade) references public.trade_settings (trade)
  on update cascade on delete restrict;

-- PostgREST garde le schéma en cache : sans ce signal, l'API continue de
-- répondre « column does not exist » sur les colonnes tout juste ajoutées.
notify pgrst, 'reload schema';

-- Contrôle : anciens_check = 0, nouvelles_fk = 2.
select
  (select count(*) from information_schema.table_constraints
    where constraint_name in ('jobs_trade_check', 'worker_profiles_trade_check')) as anciens_check,
  (select count(*) from information_schema.table_constraints
    where constraint_name in ('jobs_trade_fkey', 'worker_profiles_trade_fkey')) as nouvelles_fk;
