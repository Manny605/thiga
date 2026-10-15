-- THIGA — formulaire « Contactez-nous ».
--
-- Visiteurs et comptes connectés écrivent à l'équipe depuis la page Contact.
-- Les messages sont lus et traités dans l'espace admin (module Messages) ;
-- l'équipe répond par téléphone, WhatsApp ou e-mail, hors plateforme.
--
-- Aucune écriture directe dans la table : le dépôt passe par
-- submit_contact_message, qui valide les champs et limite les envois
-- (5 par numéro ou par e-mail et par heure, 200 au total par heure).

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  phone text,
  email text check (email is null or char_length(email) <= 254),
  subject text not null check (subject in ('general', 'account', 'job', 'partnership', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  profile_id uuid references public.profiles (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'handled')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,
  constraint contact_messages_reachable check (phone is not null or email is not null)
);

alter table public.contact_messages enable row level security;

create index if not exists contact_messages_new_idx
  on public.contact_messages (created_at) where status = 'new';

drop policy if exists "admin reads contact messages" on public.contact_messages;
create policy "admin reads contact messages"
  on public.contact_messages for select
  using (public.is_admin());

drop policy if exists "admin handles contact messages" on public.contact_messages;
create policy "admin handles contact messages"
  on public.contact_messages for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin deletes contact messages" on public.contact_messages;
create policy "admin deletes contact messages"
  on public.contact_messages for delete
  using (public.is_admin());

/**
 * Dépôt d'un message, ouvert aux visiteurs. Il faut un moyen de répondre :
 * un numéro mauritanien valide ou une adresse e-mail. Au-delà de la limite
 * d'envoi, l'erreur `rate_limited` est levée (le formulaire l'explique).
 */
create or replace function public.submit_contact_message(
  p_name text,
  p_phone text,
  p_email text,
  p_subject text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_phone text;
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_message text := btrim(coalesce(p_message, ''));
begin
  if char_length(v_name) not between 2 and 80
     or char_length(v_message) not between 10 and 2000
     or p_subject not in ('general', 'account', 'job', 'partnership', 'other') then
    raise exception 'invalid' using errcode = '22023';
  end if;

  if v_digits <> '' then
    v_digits := public.mr_phone_digits(v_digits);
    if v_digits !~ '^[234]\d{7}$' then
      raise exception 'invalid' using errcode = '22023';
    end if;
    v_phone := '+222 ' || regexp_replace(v_digits, '(\d{2})(?=\d)', '\1 ', 'g');
  end if;

  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'invalid' using errcode = '22023';
  end if;

  if v_phone is null and v_email is null then
    raise exception 'invalid' using errcode = '22023';
  end if;

  if (select count(*) from public.contact_messages
      where created_at > now() - interval '1 hour'
        and ((v_phone is not null and phone = v_phone) or (v_email is not null and email = v_email))) >= 5
     or (select count(*) from public.contact_messages where created_at > now() - interval '1 hour') >= 200 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.contact_messages (name, phone, email, subject, message, profile_id)
  values (v_name, v_phone, v_email, p_subject, v_message, auth.uid());
end;
$$;

revoke execute on function public.submit_contact_message(text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
