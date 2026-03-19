-- Settings table for Program Review App
-- Run this in the Supabase SQL Editor
-- Stores app-wide configuration (AI mode, local AI URL, model, API keys)

create table if not exists public.pr_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- No RLS — settings are app-wide and accessed via service role key
-- If you want to restrict access, enable RLS and add appropriate policies

-- Insert default settings
insert into public.pr_settings (key, value) values
  ('ai_mode', 'local'),
  ('local_ai_url', ''),
  ('local_ai_model', '')
on conflict (key) do nothing;
