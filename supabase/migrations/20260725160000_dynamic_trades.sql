-- THIGA — catégories de métiers administrables.
--
-- Jusqu'ici la liste des métiers vivait à trois endroits : une contrainte
-- CHECK sur `jobs.trade` et `worker_profiles.trade`, une autre sur
-- `trade_settings.trade`, et un tableau codé en dur côté client avec ses
-- libellés dans les deux dictionnaires. Ajouter un métier demandait donc une
-- migration *et* une livraison. `trade_settings` devient la table de
-- référence : elle porte les libellés et l'icône, et les deux colonnes
-- `trade` la référencent par clé étrangère.

-- ── trade_settings : libellés, icône, ordre d'affichage ───────────────

alter table public.trade_settings add column if not exists label_fr text;
alter table public.trade_settings add column if not exists label_ar text;
alter table public.trade_settings add column if not exists icon text not null default 'Boxes';
alter table public.trade_settings add column if not exists sort_order integer not null default 100;

-- Reprise des libellés qui vivaient dans src/i18n/{fr,ar}.js.
update public.trade_settings as ts
set label_fr = v.label_fr, label_ar = v.label_ar, icon = v.icon, sort_order = v.sort_order
from (values
  ('menage',      'Femme de ménage',   'عاملة منزل',    'Sparkles',    10),
  ('nounou',      'Nounou',            'مربية أطفال',   'Baby',        20),
  ('chauffeur',   'Chauffeur',         'سائق',          'Car',         30),
  ('cuisinier',   'Cuisinier',         'طبّاخ',          'ChefHat',     40),
  ('electricien', 'Électricien',       'كهربائي',       'Zap',         50),
  ('plombier',    'Plombier',          'سبّاك',          'Wrench',      60),
  ('jardinier',   'Jardinier',         'بستاني',        'Leaf',        70),
  ('securite',    'Agent de sécurité', 'حارس أمن',      'ShieldCheck', 80),
  ('autre',       'Autres services',   'خدمات أخرى',    'Boxes',      999)
) as v (trade, label_fr, label_ar, icon, sort_order)
where ts.trade = v.trade;

-- Filet pour une éventuelle ligne hors liste : le slug fait office de libellé.
update public.trade_settings set label_fr = trade where label_fr is null;
update public.trade_settings set label_ar = label_fr where label_ar is null;

alter table public.trade_settings alter column label_fr set not null;
alter table public.trade_settings alter column label_ar set not null;

-- ── la liste fermée devient une table ouverte ────────────────────────

alter table public.trade_settings drop constraint if exists trade_settings_trade_check;
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

-- `on delete restrict` : une catégorie encore portée par une annonce ou un
-- profil ne peut pas être supprimée. C'est la garantie qu'aucune ligne ne se
-- retrouve avec un métier qui n'existe plus.

-- ── l'admin crée et supprime des catégories ──────────────────────────
-- 'autre' est exclue de la suppression : c'est la valeur de repli du trigger
-- d'inscription, la retirer casserait la création de compte travailleur.

drop policy if exists "admin creates trade settings" on public.trade_settings;
create policy "admin creates trade settings"
  on public.trade_settings for insert
  with check (public.is_admin());

drop policy if exists "admin deletes trade settings" on public.trade_settings;
create policy "admin deletes trade settings"
  on public.trade_settings for delete
  using (public.is_admin() and trade <> 'autre');

-- ── inscription : valider le métier contre la table, plus contre une liste ─

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

  -- Le métier vient du formulaire : il peut désigner une catégorie supprimée
  -- entre l'affichage de la page et l'envoi.
  if not exists (select 1 from public.trade_settings where trade = v_trade) then
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
