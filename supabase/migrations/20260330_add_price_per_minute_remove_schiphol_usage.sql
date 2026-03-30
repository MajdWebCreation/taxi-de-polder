alter table public.pricing_settings
  add column if not exists price_per_minute numeric(10,2) not null default 0.00;

update public.pricing_settings
set price_per_minute = case vehicle_type
  when 'auto' then 0.50
  when 'busje' then 0.65
  else price_per_minute
end
where coalesce(price_per_minute, 0) = 0;

alter table public.pricing_settings
  alter column price_per_minute drop default;

-- Veilig voor bestaande productie-data:
-- laat schiphol_surcharge tijdelijk staan als legacy kolom,
-- maar gebruik deze nergens meer in de applicatie.
-- Verwijder de kolom later pas definitief als je zeker weet
-- dat er geen externe afhankelijkheden meer op draaien.
