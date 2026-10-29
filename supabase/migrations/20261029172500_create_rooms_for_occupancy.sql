alter table public.bookings
  add column if not exists room_type_id uuid
    references public.room_types(id) on delete set null;

alter table public.bookings
  add column if not exists room_type_name text;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  room_type_id uuid references public.room_types(id) on delete set null,
  label text not null,
  status text not null default 'vacant'
    check (status in ('occupied', 'vacant', 'cleaning', 'maintenance', 'reserved')),
  current_booking_id uuid references public.bookings(id) on delete set null,
  last_cleaned_at timestamptz,
  notes text default '',
  created_at timestamptz default now()
);

create index if not exists rooms_listing_id_label_idx
  on public.rooms (listing_id, label);

alter table public.rooms enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'rooms'
      and policyname = 'host all'
  ) then
    create policy "host all"
      on public.rooms
      for all
      to authenticated
      using (
        listing_id in (
          select id
          from public.listings
          where host_id = auth.uid()
        )
      )
      with check (
        listing_id in (
          select id
          from public.listings
          where host_id = auth.uid()
        )
      );
  end if;
end
$$;
