-- THIGA — seuls les travailleurs peuvent signaler.
--
-- Le signalement protège d'abord les travailleurs (fausses offres, demandes
-- d'argent, harcèlement). Un employeur ou un admin ne peut plus en déposer ;
-- un compte suspendu non plus. La règle vit en base : l'interface masque le
-- bouton, mais c'est ici qu'elle est garantie.

drop policy if exists "authenticated users submit reports" on public.reports;
drop policy if exists "workers submit reports" on public.reports;
create policy "workers submit reports"
  on public.reports for insert
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'worker' and p.status = 'active'
    )
  );
