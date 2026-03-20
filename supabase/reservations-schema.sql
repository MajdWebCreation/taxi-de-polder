do $$
begin
  if not exists (select 1 from pg_type where typname = 'reservation_status') then
    create type public.reservation_status as enum ('pending', 'confirmed', 'rejected');
  end if;
end $$;

create table if not exists public.reservations (
  id bigint generated always as identity primary key,
  status public.reservation_status not null default 'pending',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  pickup text not null,
  destination text not null,
  pickup_date date not null,
  pickup_time text not null,
  passengers integer not null,
  vehicle_type public.vehicle_type not null,
  notes text,
  distance_km numeric(10,2) not null,
  duration_text text not null,
  price_total numeric(10,2) not null,
  pricing_mode text not null,
  admin_note text,
  action_token uuid not null unique,
  customer_email_sent_at timestamptz,
  status_email_sent_at timestamptz,
  confirmed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reservations enable row level security;

drop policy if exists "reservations_admin_select" on public.reservations;
create policy "reservations_admin_select"
on public.reservations
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);

drop policy if exists "reservations_admin_update" on public.reservations;
create policy "reservations_admin_update"
on public.reservations
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admin_users
    where admin_users.user_id = auth.uid()
  )
);