-- Oubli dans 20260724190000_init.sql : private_contact n'avait qu'une policy
-- SELECT/UPDATE. Un utilisateur inscrit sans téléphone ne pouvait pas en
-- ajouter un ensuite depuis ses paramètres de compte (pas de policy INSERT ;
-- seul le trigger de signup, security definer, y insérait).
create policy "users insert their own contact info"
  on public.private_contact for insert
  with check (auth.uid() = profile_id);
