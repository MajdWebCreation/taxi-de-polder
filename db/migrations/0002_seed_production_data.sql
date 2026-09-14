-- Productiedata overgenomen uit het Supabase-project (ref iollmruthkvtelpwkutp)
-- zoals gelezen op 2026-09-14. IDs, prijzen, sorteervolgorde en timestamps
-- zijn één op één behouden. `timestamptz` waarden zijn UTC en afgerond op
-- milliseconden, passend bij DATETIME(3).
--
-- INSERT IGNORE zodat deze migratie idempotent is en bestaande, door de
-- beheerder gewijzigde rijen nooit overschrijft.

INSERT IGNORE INTO pricing_settings
  (id, vehicle_type, base_fare, price_per_km, price_per_minute, minimum_fare, night_surcharge, updated_at)
VALUES
  (1, 'auto',  12.00, 2.35, 0.50, 25.00, 10.00, '2026-09-09 09:30:00.000'),
  (2, 'busje', 20.00, 3.25, 0.65, 40.00, 15.00, '2026-09-09 09:04:26.824');

INSERT IGNORE INTO special_rates
  (id, from_label, to_label, vehicle_type, fixed_price, is_active, sort_order, created_at, updated_at)
VALUES
  (8,  'Beverwijk',    'Schiphol', 'auto',   65.00, 1,  1, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (2,  'Heemskerk',    'Schiphol', 'auto',   70.00, 1,  2, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (9,  'Wijk aan Zee', 'Schiphol', 'auto',   80.00, 1,  3, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (12, 'Uitgeest',     'Schiphol', 'auto',   75.00, 1,  4, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (14, 'Assendelft',   'Schiphol', 'auto',   70.00, 1,  5, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (11, 'Velsen-Noord', 'Schiphol', 'auto',   65.00, 1,  6, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (5,  'Haarlem',      'Schiphol', 'auto',   80.00, 1,  7, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (7,  'Beverwijk',    'Schiphol', 'busje',  90.00, 1, 11, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (13, 'Heemskerk',    'Schiphol', 'busje', 100.00, 1, 12, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (4,  'Wijk aan Zee', 'Schiphol', 'busje', 110.00, 1, 13, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (6,  'Uitgeest',     'Schiphol', 'busje', 110.00, 1, 14, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (1,  'Assendelft',   'Schiphol', 'busje', 100.00, 1, 15, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (3,  'Velsen-Noord', 'Schiphol', 'busje', 110.00, 1, 16, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471'),
  (10, 'Haarlem',      'Schiphol', 'busje',  90.00, 1, 17, '2026-09-09 09:07:10.471', '2026-09-09 09:07:10.471');
