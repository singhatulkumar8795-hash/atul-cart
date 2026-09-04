-- Run this file in a Supabase project when the free backend is ready.
create table if not exists public.products (
  id bigint primary key,
  name text not null,
  category text not null,
  price integer not null check (price >= 0),
  old_price integer not null check (old_price >= price),
  discount text not null,
  rating numeric(2,1) default 0,
  reviews integer default 0,
  emoji text,
  color text,
  tag text,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  pin text not null,
  payment_method text not null check (payment_method in ('cod', 'upi')),
  total integer not null check (total >= 0),
  status text not null default 'Confirmed',
  items jsonb not null,
  created_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

create policy "Products are publicly readable"
  on public.products for select
  using (true);

create policy "Anyone can submit an order"
  on public.orders for insert
  with check (true);
