do $$
begin
  if not exists (select 1 from pg_type where typname = 'vehicle_type') then
    create type public.vehicle_type as enum ('auto', 'busje');
  end if;
end $$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_settings (
  id bigint generated always as identity primary key,
  vehicle_type public.vehicle_type not null unique,
  base_fare numeric(10,2) not null,
  price_per_km numeric(10,2) not null,
  price_per_minute numeric(10,2) not null default 0.00,
  minimum_fare numeric(10,2) not null,
  night_surcharge numeric(10,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.special_rates (
  id bigint generated always as identity primary key,
  from_label text not null,
  to_label text not null,
  vehicle_type public.vehicle_type not null,
  fixed_price numeric(10,2) not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.special_rates enable row level security;

drop policy if exists "admin_users_select_own" on public.admin_users;
create policy "admin_users_select_own"
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "pricing_settings_admin_select" on public.pricing_settings;
create policy "pricing_settings_admin_select"
on public.pricing_settings
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "pricing_settings_admin_insert" on public.pricing_settings;
create policy "pricing_settings_admin_insert"
on public.pricing_settings
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "pricing_settings_admin_update" on public.pricing_settings;
create policy "pricing_settings_admin_update"
on public.pricing_settings
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "special_rates_admin_select" on public.special_rates;
create policy "special_rates_admin_select"
on public.special_rates
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "special_rates_admin_insert" on public.special_rates;
create policy "special_rates_admin_insert"
on public.special_rates
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "special_rates_admin_update" on public.special_rates;
create policy "special_rates_admin_update"
on public.special_rates
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "special_rates_admin_delete" on public.special_rates;
create policy "special_rates_admin_delete"
on public.special_rates
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

insert into public.pricing_settings (
  vehicle_type,
  base_fare,
  price_per_km,
  price_per_minute,
  minimum_fare,
  night_surcharge
)
values
  ('auto', 12.00, 2.35, 0.50, 25.00, 10.00),
  ('busje', 20.00, 3.25, 0.65, 40.00, 15.00)
on conflict (vehicle_type) do nothing;
