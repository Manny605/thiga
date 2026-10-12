-- THIGA — e-mail d'un compte, pour la fiche utilisateur de l'espace admin.
--
-- L'adresse vit dans auth.users, inaccessible depuis le navigateur. Cette
-- fonction ne la renvoie qu'à un admin ; pour tout autre appelant, NULL.

create or replace function public.admin_user_email(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email::text
  from auth.users u
  where u.id = p_user and public.is_admin();
$$;

revoke execute on function public.admin_user_email(uuid) from public, anon;
grant execute on function public.admin_user_email(uuid) to authenticated;

notify pgrst, 'reload schema';
