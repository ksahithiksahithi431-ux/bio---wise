-- Run this script in your Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.biogas_estimates (
  id uuid primary key default gen_random_uuid(),
  waste_type text not null,
  quantity_kg numeric(12, 3) not null check (quantity_kg > 0),
  yield_m3_per_kg numeric(10, 5) not null check (yield_m3_per_kg > 0),
  estimated_biogas_m3 numeric(14, 3) not null check (estimated_biogas_m3 >= 0),
  created_at timestamptz not null default now()
);

create index if not exists biogas_estimates_created_at_idx
  on public.biogas_estimates (created_at desc);

-- The backend uses the Supabase server-side secret, so requests go through Node.js.
-- Do not expose the server-side secret in frontend code.
