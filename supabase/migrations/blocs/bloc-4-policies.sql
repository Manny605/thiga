-- BLOC 4/5 — l'admin crée et supprime des catégories.
-- 'autre' est exclue de la suppression : c'est la valeur de repli du trigger
-- d'inscription, la retirer casserait la création de compte travailleur.
drop policy if exists "admin creates trade settings" on public.trade_settings;
create policy "admin creates trade settings"
  on public.trade_settings for insert
  with check (public.is_admin());

drop policy if exists "admin deletes trade settings" on public.trade_settings;
create policy "admin deletes trade settings"
  on public.trade_settings for delete
  using (public.is_admin() and trade <> 'autre');

-- Contrôle : doit renvoyer 4 policies (select, update, insert, delete).
select policyname, cmd
from pg_policies
where tablename = 'trade_settings'
order by cmd;
