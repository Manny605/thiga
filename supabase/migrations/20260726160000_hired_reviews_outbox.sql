-- THIGA — statut « Embauché », avis réciproques, file d'envoi des notifications.

-- ════════════════════════════════════════════════════════════════════════
-- 1. Statut « Embauché »
-- ════════════════════════════════════════════════════════════════════════
-- Posé par l'employeur sur une candidature présélectionnée. C'est lui qui
-- ouvre les avis : seule une embauche réelle permet de noter l'autre partie.

alter table public.applications drop constraint if exists applications_status_check;
alter table public.applications add constraint applications_status_check
  check (status in ('new', 'seen', 'shortlisted', 'hired', 'rejected'));

-- « Embauché » ne s'atteint que depuis « Présélectionné », et n'en ressort que
-- pour y revenir (erreur de clic). L'admin et les scripts ne sont pas bridés.
create or replace function public.guard_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_privileged() or new.status is not distinct from old.status then
    return new;
  end if;
  if new.status = 'hired' and old.status <> 'shortlisted' then
    raise exception 'only a shortlisted application can be marked hired';
  end if;
  if old.status = 'hired' and new.status <> 'shortlisted' then
    raise exception 'a hired application can only go back to shortlisted';
  end if;
  return new;
end;
$$;

drop trigger if exists applications_guard_status on public.applications;
create trigger applications_guard_status
  before update on public.applications
  for each row execute function public.guard_application_status();

-- Un travailleur embauché ne peut plus retirer sa candidature : la retirer
-- effacerait la trace de l'embauche sur laquelle reposent les avis.
drop policy if exists "workers withdraw their own applications" on public.applications;
create policy "workers withdraw their own applications"
  on public.applications for delete
  using ((worker_id = auth.uid() and status <> 'hired') or public.is_admin());

-- Le numéro reste visible après l'embauche.
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
    where a.status in ('shortlisted', 'hired')
      and (
        (j.employer_id = auth.uid() and a.worker_id = p_profile)
        or (a.worker_id = auth.uid() and j.employer_id = p_profile)
      )
  );
$$;

-- ════════════════════════════════════════════════════════════════════════
-- 2. Avis
-- ════════════════════════════════════════════════════════════════════════
-- Un avis par partie et par embauche, publics. `application_id` passe à NULL
-- si la candidature disparaît (annonce supprimée) : supprimer son annonce ne
-- doit pas permettre d'effacer les avis reçus.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications (id) on delete set null,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (application_id, reviewer_id)
);

alter table public.reviews enable row level security;

create index if not exists reviews_reviewee_id_idx on public.reviews (reviewee_id);
create index if not exists reviews_reviewer_id_idx on public.reviews (reviewer_id);

/**
 * L'autre partie d'une embauche, vue depuis le compte connecté ; NULL si la
 * candidature n'est pas « Embauché » ou si le compte n'y est pas partie.
 */
create or replace function public.review_target(p_application uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when a.worker_id = auth.uid() then j.employer_id
    when j.employer_id = auth.uid() then a.worker_id
  end
  from public.applications a
  join public.jobs j on j.id = a.job_id
  where a.id = p_application and a.status = 'hired';
$$;

drop policy if exists "reviews are public" on public.reviews;
create policy "reviews are public"
  on public.reviews for select
  using (true);

drop policy if exists "parties review a hire" on public.reviews;
create policy "parties review a hire"
  on public.reviews for insert
  with check (
    reviewer_id = auth.uid()
    and public.is_active()
    and reviewee_id = public.review_target(application_id)
  );

drop policy if exists "reviewers edit their review" on public.reviews;
create policy "reviewers edit their review"
  on public.reviews for update
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());

drop policy if exists "reviewers and admin delete reviews" on public.reviews;
create policy "reviewers and admin delete reviews"
  on public.reviews for delete
  using (reviewer_id = auth.uid() or public.is_admin());

-- Une modification ne touche que la note et le commentaire.
create or replace function public.guard_review_columns()
returns trigger
language plpgsql
as $$
begin
  if new.application_id is distinct from old.application_id
     or new.reviewer_id is distinct from old.reviewer_id
     or new.reviewee_id is distinct from old.reviewee_id then
    raise exception 'only rating and comment can change';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reviews_guard_columns on public.reviews;
create trigger reviews_guard_columns
  before update on public.reviews
  for each row execute function public.guard_review_columns();

-- Moyenne et nombre d'avis par personne notée, pour les cartes et les fiches.
create or replace view public.review_stats
with (security_invoker = true) as
  select reviewee_id, round(avg(rating)::numeric, 1) as average, count(*)::int as total
  from public.reviews
  group by reviewee_id;

grant select on public.review_stats to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════
-- 3. File d'envoi des notifications
-- ════════════════════════════════════════════════════════════════════════
-- Chaque événement qui mérite un message hors du site y est inscrit par un
-- trigger. Aucun canal n'est encore branché : un envoyeur (fonction Edge,
-- e-mail ou SMS) lira les lignes où `sent_at` est NULL et les marquera.
-- Seul l'admin lit la table ; les triggers écrivent en SECURITY DEFINER.

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  channel text,
  error text
);

alter table public.notification_outbox enable row level security;

create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (created_at) where sent_at is null;

drop policy if exists "admin reads the outbox" on public.notification_outbox;
create policy "admin reads the outbox"
  on public.notification_outbox for select
  using (public.is_admin());

create or replace function public.enqueue_notification(p_recipient uuid, p_kind text, p_payload jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notification_outbox (recipient_id, kind, payload)
  values (p_recipient, p_kind, p_payload);
$$;

revoke execute on function public.enqueue_notification(uuid, text, jsonb) from public, anon, authenticated;

-- Candidature reçue → employeur ; changement de statut → travailleur.
create or replace function public.notify_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job record;
begin
  select j.id, j.title, j.employer_id into v_job from public.jobs j where j.id = new.job_id;

  if tg_op = 'INSERT' then
    perform public.enqueue_notification(v_job.employer_id, 'application_received', jsonb_build_object(
      'application_id', new.id, 'job_id', v_job.id, 'job_title', v_job.title,
      'worker_name', (select full_name from public.profiles where id = new.worker_id)
    ));
  elsif new.status is distinct from old.status and new.status in ('shortlisted', 'hired', 'rejected') then
    perform public.enqueue_notification(new.worker_id, 'application_' || new.status, jsonb_build_object(
      'application_id', new.id, 'job_id', v_job.id, 'job_title', v_job.title,
      'employer_name', (select full_name from public.profiles where id = v_job.employer_id)
    ));
  end if;
  return new;
end;
$$;

drop trigger if exists applications_notify on public.applications;
create trigger applications_notify
  after insert or update of status on public.applications
  for each row execute function public.notify_application();

-- Décision sur une demande de vérification → demandeur.
create or replace function public.notify_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    perform public.enqueue_notification(new.employer_id, 'verification_' || new.status,
      jsonb_build_object('request_id', new.id, 'note', new.note));
  end if;
  return new;
end;
$$;

drop trigger if exists verification_requests_notify on public.verification_requests;
create trigger verification_requests_notify
  after update of status on public.verification_requests
  for each row execute function public.notify_verification();

-- Nouvel avis → personne notée.
create or replace function public.notify_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.enqueue_notification(new.reviewee_id, 'review_received', jsonb_build_object(
    'review_id', new.id, 'rating', new.rating,
    'reviewer_name', (select full_name from public.profiles where id = new.reviewer_id)
  ));
  return new;
end;
$$;

drop trigger if exists reviews_notify on public.reviews;
create trigger reviews_notify
  after insert on public.reviews
  for each row execute function public.notify_review();

notify pgrst, 'reload schema';
