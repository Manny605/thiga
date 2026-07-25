-- BLOC 1/5 — colonnes de trade_settings (libellés, icône, ordre).
alter table public.trade_settings add column if not exists label_fr text;
alter table public.trade_settings add column if not exists label_ar text;
alter table public.trade_settings add column if not exists icon text not null default 'Boxes';
alter table public.trade_settings add column if not exists sort_order integer not null default 100;

-- Contrôle : doit renvoyer 4.
select count(*) as colonnes_ajoutees
from information_schema.columns
where table_name = 'trade_settings'
  and column_name in ('label_fr', 'label_ar', 'icon', 'sort_order');
