-- THIGA — messages de contact transmis par e-mail à la propriétaire.
--
-- Après le dépôt, la page Contact appelle l'Edge Function contact-email avec
-- l'identifiant du message ; la fonction l'envoie (Resend) et date l'envoi
-- dans emailed_at. Un message n'est envoyé qu'une fois : la fonction réserve
-- la ligne avant l'envoi et la libère en cas d'échec. Le module Messages de
-- l'admin reste la copie de référence, e-mail parti ou non.

alter table public.contact_messages
  add column if not exists emailed_at timestamptz;

-- Le dépôt renvoie désormais l'identifiant du message (avant : rien).
drop function if exists public.submit_contact_message(text, text, text, text, text);

create function public.submit_contact_message(
  p_name text,
  p_phone text,
  p_email text,
  p_subject text,
  p_message text
)
returns uuid
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
  v_id uuid;
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
  values (v_name, v_phone, v_email, p_subject, v_message, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.submit_contact_message(text, text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
