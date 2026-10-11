-- THIGA — photo de profil des utilisateurs.
--
-- Contrairement au CV, la photo est publique : elle s'affiche sur l'annuaire,
-- les fiches et les annonces, y compris pour les visiteurs non connectés.
-- Bucket public donc, mais écriture limitée au dossier `<user_id>/`.
-- Le navigateur recadre et compresse l'image avant l'envoi (512 px, WebP/JPEG).

-- ── bucket public ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- ── colonne ───────────────────────────────────────────────────────────
alter table public.profiles add column if not exists avatar_path text;

-- ── une photo appartient à son propriétaire ──────────────────────────
-- Sans ce contrôle, un utilisateur pourrait afficher la photo d'un autre.
-- On conserve les verrous posés précédemment (role et status réservés à l'admin).
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_privileged() then
    if new.role is distinct from old.role then
      raise exception 'role is not self-assignable';
    end if;
    if new.status is distinct from old.status then
      raise exception 'status is not self-assignable';
    end if;
  end if;

  if new.avatar_path is not null and split_part(new.avatar_path, '/', 1) <> new.id::text then
    raise exception 'avatar_path must belong to the user';
  end if;

  return new;
end;
$$;

-- ── stockage : dépôt, remplacement, suppression ──────────────────────
-- Le propriétaire dans son dossier ; l'admin partout, pour retirer une photo
-- inappropriée. La lecture passe par l'URL publique du bucket.

drop policy if exists "users upload their own avatar" on storage.objects;
create policy "users upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update their own avatar" on storage.objects;
create policy "users update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users and admin delete avatars" on storage.objects;
create policy "users and admin delete avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- La suppression via l'API Storage lit d'abord l'objet : sans policy SELECT,
-- `remove()` ne trouve rien et ne supprime rien, sans erreur.
drop policy if exists "users and admin read avatars" on storage.objects;
create policy "users and admin read avatars"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

notify pgrst, 'reload schema';
