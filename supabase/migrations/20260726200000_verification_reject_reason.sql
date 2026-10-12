-- THIGA — motif de refus d'une vérification d'identité.
--
-- Jusqu'ici, un refus ne disait pas pourquoi : le demandeur risquait de
-- renvoyer la même pièce. L'admin choisit désormais un motif dans une liste
-- (stocké sous forme de code, traduit à l'affichage dans la langue du
-- demandeur) et peut ajouter une précision libre.
-- `note` reste le message du demandeur ; `review_note` est celui de l'admin.

alter table public.verification_requests add column if not exists reject_reason text;
alter table public.verification_requests add column if not exists review_note text;

alter table public.verification_requests drop constraint if exists verification_requests_reject_reason_check;
alter table public.verification_requests add constraint verification_requests_reject_reason_check
  check (reject_reason is null or reject_reason in ('blurry', 'expired', 'mismatch', 'wrong_document', 'incomplete', 'other'));

alter table public.verification_requests drop constraint if exists verification_requests_review_note_length;
alter table public.verification_requests add constraint verification_requests_review_note_length
  check (review_note is null or char_length(review_note) <= 500);

-- La notification de décision emporte le motif, pour l'envoyeur à venir.
create or replace function public.notify_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status and new.status in ('approved', 'rejected') then
    perform public.enqueue_notification(new.employer_id, 'verification_' || new.status, jsonb_build_object(
      'request_id', new.id,
      'reject_reason', new.reject_reason,
      'review_note', new.review_note
    ));
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
