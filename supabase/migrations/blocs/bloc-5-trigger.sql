-- BLOC 5/5 — inscription : valider le métier contre la table, plus contre une
-- liste écrite en dur.
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

-- Contrôle : doit renvoyer 1.
select count(*) as fonction_a_jour
from pg_proc
where proname = 'handle_new_user'
  and prosrc like '%trade_settings%';
