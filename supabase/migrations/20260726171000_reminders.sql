-- THIGA — rappels planifiés, déposés dans la file d'envoi (notification_outbox).
--
-- Chaque matin à 8 h (UTC, heure de Nouakchott) :
--   · l'employeur dont une annonce en ligne expire dans 2 jours est prévenu,
--     une seule fois par annonce et par date limite ;
--   · un travailleur dont le profil est incomplet (pas de photo, de
--     présentation, de CV, ou pas encore vérifié) est relancé, au plus une
--     fois par semaine et seulement s'il est actif.

create or replace function public.enqueue_daily_reminders()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_outbox (recipient_id, kind, payload)
  select j.employer_id, 'job_expiring',
         jsonb_build_object('job_id', j.id, 'job_title', j.title, 'deadline', j.deadline)
  from public.jobs j
  join public.profiles p on p.id = j.employer_id and p.status = 'active'
  where j.status = 'online'
    and j.deadline = (now() at time zone 'utc')::date + 2
    and not exists (
      select 1 from public.notification_outbox o
      where o.kind = 'job_expiring'
        and o.payload ->> 'job_id' = j.id::text
        and o.payload ->> 'deadline' = j.deadline::text
    );

  insert into public.notification_outbox (recipient_id, kind, payload)
  select w.profile_id, 'profile_incomplete', jsonb_build_object(
           'missing', to_jsonb(array_remove(array[
             case when p.avatar_path is null then 'photo' end,
             case when coalesce(w.bio, '') = '' then 'bio' end,
             case when w.cv_path is null then 'cv' end,
             case when not w.verified then 'verification' end
           ], null))
         )
  from public.worker_profiles w
  join public.profiles p on p.id = w.profile_id and p.status = 'active'
  where (p.avatar_path is null or coalesce(w.bio, '') = '' or w.cv_path is null or not w.verified)
    and not exists (
      select 1 from public.notification_outbox o
      where o.recipient_id = w.profile_id
        and o.kind = 'profile_incomplete'
        and o.created_at > now() - interval '7 days'
    );
end;
$$;

revoke execute on function public.enqueue_daily_reminders() from public, anon, authenticated;

create extension if not exists pg_cron;

-- Planifier sous le même nom remplace la planification existante.
select cron.schedule('thiga-daily-reminders', '0 8 * * *', 'select public.enqueue_daily_reminders()');
