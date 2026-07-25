-- BLOC 2/5 — reprise des libellés qui vivaient dans src/i18n/{fr,ar}.js.
update public.trade_settings as ts
set label_fr = v.label_fr, label_ar = v.label_ar, icon = v.icon, sort_order = v.sort_order
from (values
  ('menage',      'Femme de ménage',   'عاملة منزل',  'Sparkles',    10),
  ('nounou',      'Nounou',            'مربية أطفال', 'Baby',        20),
  ('chauffeur',   'Chauffeur',         'سائق',        'Car',         30),
  ('cuisinier',   'Cuisinier',         'طبّاخ',        'ChefHat',     40),
  ('electricien', 'Électricien',       'كهربائي',     'Zap',         50),
  ('plombier',    'Plombier',          'سبّاك',        'Wrench',      60),
  ('jardinier',   'Jardinier',         'بستاني',      'Leaf',        70),
  ('securite',    'Agent de sécurité', 'حارس أمن',    'ShieldCheck', 80),
  ('autre',       'Autres services',   'خدمات أخرى',  'Boxes',      999)
) as v (trade, label_fr, label_ar, icon, sort_order)
where ts.trade = v.trade;

-- Filet pour une éventuelle ligne hors liste : le slug fait office de libellé.
update public.trade_settings set label_fr = trade where label_fr is null;
update public.trade_settings set label_ar = label_fr where label_ar is null;

alter table public.trade_settings alter column label_fr set not null;
alter table public.trade_settings alter column label_ar set not null;

-- Contrôle : 9 lignes, toutes avec un libellé dans les deux langues.
select trade, label_fr, label_ar, icon, sort_order
from public.trade_settings
order by sort_order;
