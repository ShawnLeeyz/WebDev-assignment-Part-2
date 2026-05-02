-- Run once in Supabase → SQL Editor (or use Supabase CLI migrations).
-- Adds `drivers` and links `bookings.assigned_driver_id` to the assigned driver.

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  vehicle text not null,
  plate_number text not null,
  status text not null default 'available',
  constraint drivers_status_check check (status in ('available', 'busy'))
);

create index if not exists drivers_status_idx on public.drivers (status);

alter table public.bookings
add column if not exists assigned_driver_id uuid references public.drivers (id) on delete set null;

create index if not exists bookings_assigned_driver_id_idx on public.bookings (assigned_driver_id);

alter table public.drivers enable row level security;

drop policy if exists "drivers_select_all" on public.drivers;
drop policy if exists "drivers_insert_all" on public.drivers;
drop policy if exists "drivers_update_all" on public.drivers;

-- Dev-friendly policies (tighten for production).
create policy "drivers_select_all" on public.drivers for select using (true);

create policy "drivers_insert_all" on public.drivers for insert with check (true);

create policy "drivers_update_all" on public.drivers
for update
using (true)
with check (true);

-- If bookings RLS blocks updates, add or adjust policies so anon/authenticated
-- roles can update status and assigned_driver_id as needed.
