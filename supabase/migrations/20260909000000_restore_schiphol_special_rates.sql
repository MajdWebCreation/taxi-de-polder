-- Herstel van de vaste Schiphol-tarieven.
-- Bron: de vaste tarieven die tot commit 263c8be hardcoded in
-- src/components/marketing/schiphol-rates-section.tsx stonden en op de
-- live site werden getoond. Daarna werden ze dynamisch uit special_rates
-- geladen. De oude database is verwijderd; deze waarden komen uit de
-- git-historie van de repository en zijn via /admin/pricing aan te passen.
insert into public.special_rates (from_label, to_label, vehicle_type, fixed_price, is_active, sort_order)
select v.from_label, 'Schiphol', v.vehicle_type::public.vehicle_type, v.fixed_price, true, v.sort_order
from (
  values
    ('Beverwijk',    'auto',  65.00, 1),
    ('Heemskerk',    'auto',  70.00, 2),
    ('Wijk aan Zee', 'auto',  80.00, 3),
    ('Uitgeest',     'auto',  75.00, 4),
    ('Assendelft',   'auto',  70.00, 5),
    ('Velsen-Noord', 'auto',  65.00, 6),
    ('Haarlem',      'auto',  80.00, 7),
    ('Beverwijk',    'busje', 90.00, 11),
    ('Heemskerk',    'busje', 100.00, 12),
    ('Wijk aan Zee', 'busje', 110.00, 13),
    ('Uitgeest',     'busje', 110.00, 14),
    ('Assendelft',   'busje', 100.00, 15),
    ('Velsen-Noord', 'busje', 110.00, 16),
    ('Haarlem',      'busje', 90.00, 17)
) as v(from_label, vehicle_type, fixed_price, sort_order)
where not exists (
  select 1 from public.special_rates r
  where r.from_label = v.from_label
    and r.to_label = 'Schiphol'
    and r.vehicle_type = v.vehicle_type::public.vehicle_type
);
