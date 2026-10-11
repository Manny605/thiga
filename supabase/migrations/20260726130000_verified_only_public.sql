-- THIGA — seuls les travailleurs vérifiés sont publics.
--
-- Jusqu'ici, tout profil actif apparaissait dans l'annuaire et sa fiche
-- s'ouvrait par lien direct, vérifié ou non. Désormais un profil non vérifié
-- n'est visible que :
--   · par son propriétaire (son tableau de bord doit continuer de marcher) ;
--   · par l'admin (c'est lui qui vérifie) ;
--   · par un employeur à qui ce travailleur a envoyé une candidature : sinon
--     la liste des candidats perdrait le métier et la fiche du candidat.
-- Un compte suspendu reste invisible du public, vérifié ou non.

drop policy if exists "active worker profiles are publicly readable" on public.worker_profiles;
drop policy if exists "verified worker profiles are publicly readable" on public.worker_profiles;
create policy "verified worker profiles are publicly readable"
  on public.worker_profiles for select
  using (
    profile_id = auth.uid()
    or public.is_admin()
    or (
      verified
      and exists (
        select 1 from public.profiles p
        where p.id = worker_profiles.profile_id and p.status = 'active'
      )
    )
    or exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.worker_id = worker_profiles.profile_id
        and j.employer_id = auth.uid()
    )
  );

-- ── compteur public ───────────────────────────────────────────────────
-- « Travailleurs inscrits » doit compter tous les comptes actifs, alors que
-- la policy ci-dessus ne laisse plus voir que les vérifiés. Seul le nombre
-- sort de cette fonction, jamais une ligne.
create or replace function public.active_worker_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.worker_profiles w
  join public.profiles p on p.id = w.profile_id
  where p.status = 'active';
$$;

grant execute on function public.active_worker_count() to anon, authenticated;

notify pgrst, 'reload schema';
