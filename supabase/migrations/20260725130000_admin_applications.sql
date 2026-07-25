-- Oubli dans 20260725120000_admin.sql : l'admin doit pouvoir lire toutes les
-- candidatures (compteur "Mises en relation" du Overview admin).
drop policy if exists "workers see their own applications, employers see theirs" on public.applications;
create policy "workers see their own applications, employers see theirs"
  on public.applications for select
  using (
    worker_id = auth.uid()
    or exists (select 1 from public.jobs j where j.id = applications.job_id and j.employer_id = auth.uid())
    or public.is_admin()
  );
