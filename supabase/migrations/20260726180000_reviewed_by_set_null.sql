-- THIGA — un compte ayant validé des vérifications reste supprimable.
--
-- `verification_requests.reviewed_by` pointait vers profiles sans règle de
-- suppression (NO ACTION) : supprimer un ancien admin, comme employeur1 qui
-- l'a été avant la création d'admin@thigha.mr, était refusé par la base.
-- La demande et sa décision restent ; seule la trace de qui l'a tranchée
-- disparaît avec le compte.

alter table public.verification_requests
  drop constraint if exists verification_requests_reviewed_by_fkey;

alter table public.verification_requests
  add constraint verification_requests_reviewed_by_fkey
  foreign key (reviewed_by) references public.profiles (id) on delete set null;
