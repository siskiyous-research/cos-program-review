-- FTES Override Table
-- Stores exact FTES from Banner to replace Zogotech estimates
-- Run this in the Supabase SQL Editor

create table if not exists public.ftes_override (
  id uuid default gen_random_uuid() primary key,
  subject_code text not null,
  academic_year text not null,
  ftes float not null,
  source text default 'banner',
  uploaded_at timestamptz default now(),
  unique (subject_code, academic_year)
);

alter table public.ftes_override enable row level security;

create policy "Anyone can read ftes_override"
  on public.ftes_override for select
  using (true);

create policy "Service role can insert ftes_override"
  on public.ftes_override for insert
  with check (true);

create policy "Service role can update ftes_override"
  on public.ftes_override for update
  using (true);
