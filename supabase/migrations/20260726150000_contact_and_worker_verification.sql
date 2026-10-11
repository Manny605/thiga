-- THIGA — mise en contact après présélection, vérification des travailleurs.

-- ── 1. Téléphone visible une fois la candidature présélectionnée ───────
-- Jusqu'ici, `private_contact` n'était lisible que par son propriétaire :
-- un employeur pouvait présélectionner un candidat sans aucun moyen de le
-- joindre. Le numéro devient visible, dans les deux sens, entre un employeur
-- et un travailleur dès qu'une candidature qui les relie est présélectionnée,
-- et tant que la personne dont on lit le numéro n'est pas suspendue.
--
-- SECURITY DEFINER : la fonction lit `applications` et `jobs` sans passer par
-- leurs policies, qui s'interrogent l'une l'autre.
create or replace function public.can_see_contact(p_profile uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.profiles p on p.id = p_profile and p.status = 'active'
    where a.status = 'shortlisted'
      and (
        (j.employer_id = auth.uid() and a.worker_id = p_profile)
        or (a.worker_id = auth.uid() and j.employer_id = p_profile)
      )
  );
$$;

drop policy if exists "users read their own contact info" on public.private_contact;
drop policy if exists "contact info readable by owner, admin and shortlisted counterpart" on public.private_contact;
create policy "contact info readable by owner, admin and shortlisted counterpart"
  on public.private_contact for select
  using (
    auth.uid() = profile_id
    or public.is_admin()
    or public.can_see_contact(profile_id)
  );

-- ── 2. Les travailleurs demandent aussi leur vérification ─────────────
-- La table et le stockage servaient déjà à n'importe quel compte : la policy
-- d'envoi compare `employer_id` à `auth.uid()`, et le dossier du document
-- porte l'identifiant du compte. Seul le nom de colonne est historique.
comment on column public.verification_requests.employer_id is
  'Compte qui demande la vérification : employeur ou travailleur (nom historique).';

notify pgrst, 'reload schema';
