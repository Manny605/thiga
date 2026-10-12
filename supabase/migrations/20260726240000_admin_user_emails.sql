-- THIGA — e-mails de tous les comptes, pour la liste Utilisateurs de l'admin.
--
-- Complète admin_user_email (un compte) : une seule requête pour toute la
-- liste. Pour tout autre appelant qu'un admin, la fonction ne renvoie rien.

create or replace function public.admin_user_emails()
returns table (id uuid, email text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.email::text
  from auth.users u
  where public.is_admin();
$$;

revoke execute on function public.admin_user_emails() from public, anon;
grant execute on function public.admin_user_emails() to authenticated;

notify pgrst, 'reload schema';
