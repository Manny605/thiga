-- THIGA — réinitialisation de mot de passe assistée par l'admin (sans e-mail).
--
-- L'utilisateur qui a oublié son mot de passe dépose une demande avec son
-- numéro (et son e-mail s'il s'en souvient). La base retrouve le compte et
-- compare le numéro à celui enregistré, sans jamais révéler au demandeur si un
-- compte existe. L'admin traite la demande : il génère un mot de passe
-- temporaire et le transmet UNIQUEMENT au numéro enregistré sur le compte.

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  email text,
  matched_profile_id uuid references public.profiles (id) on delete set null,
  phone_matches boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'done', 'rejected')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);

alter table public.password_reset_requests enable row level security;

create index if not exists password_reset_requests_pending_idx
  on public.password_reset_requests (created_at) where status = 'pending';

-- Lecture et traitement : admin seulement. Aucune écriture directe : le dépôt
-- passe par la fonction ci-dessous.
drop policy if exists "admin reads reset requests" on public.password_reset_requests;
create policy "admin reads reset requests"
  on public.password_reset_requests for select
  using (public.is_admin());

drop policy if exists "admin resolves reset requests" on public.password_reset_requests;
create policy "admin resolves reset requests"
  on public.password_reset_requests for update
  using (public.is_admin())
  with check (public.is_admin());

/** 8 derniers chiffres d'un numéro : « +222 22 12 34 56 », « 0022222123456 » → « 22123456 ». */
create or replace function public.mr_phone_digits(p text)
returns text
language sql
immutable
as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 8);
$$;

/**
 * Dépôt d'une demande, ouvert aux visiteurs. Ne renvoie rien : la réponse est
 * la même qu'un compte existe ou non. Au-delà de 3 demandes par numéro et par
 * heure, les suivantes sont ignorées sans le dire.
 */
create or replace function public.request_password_reset(p_phone text, p_email text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_digits text := public.mr_phone_digits(p_phone);
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_profile uuid;
  v_matches boolean := false;
begin
  if v_digits !~ '^[234]\d{7}$' then
    return;
  end if;
  if v_email is not null and char_length(v_email) > 254 then
    v_email := null;
  end if;

  if (select count(*) from public.password_reset_requests
      where public.mr_phone_digits(phone) = v_digits and created_at > now() - interval '1 hour') >= 3 then
    return;
  end if;

  -- Par e-mail d'abord : le compte est identifié, on vérifie ensuite le numéro.
  if v_email is not null then
    select p.id into v_profile
    from auth.users u join public.profiles p on p.id = u.id
    where lower(u.email) = v_email and p.role <> 'admin';
    if v_profile is not null then
      v_matches := exists (
        select 1 from public.private_contact c
        where c.profile_id = v_profile and public.mr_phone_digits(c.phone) = v_digits
      );
    end if;
  end if;

  -- Sans e-mail reconnu : le numéro seul, s'il désigne un et un seul compte.
  if v_profile is null then
    select min(c.profile_id::text)::uuid into v_profile
    from public.private_contact c join public.profiles p on p.id = c.profile_id
    where public.mr_phone_digits(c.phone) = v_digits and p.role <> 'admin'
    having count(*) = 1;
    v_matches := v_profile is not null;
  end if;

  insert into public.password_reset_requests (phone, email, matched_profile_id, phone_matches)
  values ('+222 ' || regexp_replace(v_digits, '(\d{2})(?=\d)', '\1 ', 'g'), v_email, v_profile, v_matches);
end;
$$;

revoke execute on function public.request_password_reset(text, text) from public;
grant execute on function public.request_password_reset(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
