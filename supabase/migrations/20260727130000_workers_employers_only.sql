-- THIGA — les informations des travailleurs sont réservées aux employeurs.
--
-- Règle : seuls les employeurs connectés (compte actif) et l'admin voient les
-- travailleurs (nom, photo, fiche, avis reçus). Visiteurs et travailleurs ne
-- voient que les annonces. Un travailleur voit toujours son propre profil, et
-- un employeur garde l'accès aux candidats de ses annonces, même suspendu
-- (historique de ses candidatures).
--
-- Inchangé : le numéro de téléphone (private_contact) n'est communiqué qu'après
-- présélection ou embauche (can_see_contact) ; le CV, par liens temporaires.
--
-- Les profils employeurs et admin restent publics : les annonces affichent le
-- nom de l'employeur. Les avis reçus par un employeur restent publics, mais le
-- nom de leur auteur (un travailleur) n'est plus lisible hors employeurs.

/** Compte connecté autorisé à consulter les travailleurs : employeur actif ou admin. */
create or replace function public.can_view_workers()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active' and role in ('employer', 'admin')
  );
$$;

/** Rôle d'un profil, lu sans passer par la RLS (pour les policies). */
create or replace function public.profile_role(p_profile uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = p_profile;
$$;

/** Ce travailleur a-t-il postulé à une annonce du compte connecté ? */
create or replace function public.applied_to_my_jobs(p_worker uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.worker_id = p_worker and j.employer_id = auth.uid()
  );
$$;

revoke execute on function public.can_view_workers() from public;
revoke execute on function public.profile_role(uuid) from public;
revoke execute on function public.applied_to_my_jobs(uuid) from public;
grant execute on function public.can_view_workers() to anon, authenticated;
grant execute on function public.profile_role(uuid) to anon, authenticated;
grant execute on function public.applied_to_my_jobs(uuid) to anon, authenticated;

-- ── profiles ───────────────────────────────────────────────────────────
drop policy if exists "profiles are publicly readable" on public.profiles;
drop policy if exists "profiles readable: workers by employers only" on public.profiles;
create policy "profiles readable: workers by employers only"
  on public.profiles for select
  using (
    role <> 'worker'
    or id = auth.uid()
    or public.can_view_workers()
    or public.applied_to_my_jobs(id)
  );

-- ── worker_profiles ────────────────────────────────────────────────────
drop policy if exists "verified worker profiles are publicly readable" on public.worker_profiles;
drop policy if exists "worker profiles readable by employers" on public.worker_profiles;
create policy "worker profiles readable by employers"
  on public.worker_profiles for select
  using (
    profile_id = auth.uid()
    or public.is_admin()
    or public.applied_to_my_jobs(profile_id)
    or (
      public.can_view_workers()
      and verified
      and exists (select 1 from public.profiles p where p.id = worker_profiles.profile_id and p.status = 'active')
    )
  );

-- ── reviews ────────────────────────────────────────────────────────────
-- review_stats (security_invoker) suit la même règle.
drop policy if exists "reviews are public" on public.reviews;
drop policy if exists "reviews of workers readable by employers" on public.reviews;
create policy "reviews of workers readable by employers"
  on public.reviews for select
  using (
    public.profile_role(reviewee_id) <> 'worker'
    or reviewee_id = auth.uid()
    or reviewer_id = auth.uid()
    or public.can_view_workers()
    or public.applied_to_my_jobs(reviewee_id)
  );

-- ── chiffres publics ───────────────────────────────────────────────────
-- Le nombre de profils vérifiés était compté à travers la policy de
-- worker_profiles, désormais fermée aux visiteurs : seul le nombre sort.
create or replace function public.verified_worker_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.worker_profiles w
  join public.profiles p on p.id = w.profile_id
  where w.verified and p.status = 'active';
$$;

grant execute on function public.verified_worker_count() to anon, authenticated;

notify pgrst, 'reload schema';
