-- Supabase Schema for Program Review App
-- Run this in the Supabase SQL Editor
-- All tables use pr_ prefix to avoid conflicts with other apps sharing the project

-- 1. Profiles table (extends auth.users)
create table public.pr_profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  institution text default 'College of the Siskiyous',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pr_profiles enable row level security;

create policy "Users can view own profile"
  on public.pr_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.pr_profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.pr_profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_pr_new_user()
returns trigger as $$
begin
  insert into public.pr_profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_pr
  after insert on auth.users
  for each row execute procedure public.handle_pr_new_user();

-- 2. Reviews table
create table public.pr_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  program_name text not null,
  review_type text not null check (review_type in ('annual', 'comprehensive_instructional', 'comprehensive_non_instructional')),
  status text default 'draft' check (status in ('draft', 'submitted', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, program_name, review_type, status)
);

alter table public.pr_reviews enable row level security;

create policy "Users can view own reviews"
  on public.pr_reviews for select
  using (auth.uid() = user_id);

create policy "Users can insert own reviews"
  on public.pr_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.pr_reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.pr_reviews for delete
  using (auth.uid() = user_id);

-- 3. Review sections table
create table public.pr_review_sections (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.pr_reviews on delete cascade not null,
  section_id text not null,
  content text default '',
  citations jsonb,
  guidance text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (review_id, section_id)
);

alter table public.pr_review_sections enable row level security;

create policy "Users can view own review sections"
  on public.pr_review_sections for select
  using (
    exists (
      select 1 from public.pr_reviews
      where pr_reviews.id = pr_review_sections.review_id
      and pr_reviews.user_id = auth.uid()
    )
  );

create policy "Users can insert own review sections"
  on public.pr_review_sections for insert
  with check (
    exists (
      select 1 from public.pr_reviews
      where pr_reviews.id = pr_review_sections.review_id
      and pr_reviews.user_id = auth.uid()
    )
  );

create policy "Users can update own review sections"
  on public.pr_review_sections for update
  using (
    exists (
      select 1 from public.pr_reviews
      where pr_reviews.id = pr_review_sections.review_id
      and pr_reviews.user_id = auth.uid()
    )
  );

create policy "Users can delete own review sections"
  on public.pr_review_sections for delete
  using (
    exists (
      select 1 from public.pr_reviews
      where pr_reviews.id = pr_review_sections.review_id
      and pr_reviews.user_id = auth.uid()
    )
  );

-- 4. Program data cache (Phase 2)
create table public.pr_program_data_cache (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.pr_reviews on delete cascade not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pr_program_data_cache enable row level security;

create policy "Users can view own program data cache"
  on public.pr_program_data_cache for select
  using (
    exists (
      select 1 from public.pr_reviews
      where pr_reviews.id = pr_program_data_cache.review_id
      and pr_reviews.user_id = auth.uid()
    )
  );

create policy "Users can insert own program data cache"
  on public.pr_program_data_cache for insert
  with check (
    exists (
      select 1 from public.pr_reviews
      where pr_reviews.id = pr_program_data_cache.review_id
      and pr_reviews.user_id = auth.uid()
    )
  );

create policy "Users can update own program data cache"
  on public.pr_program_data_cache for update
  using (
    exists (
      select 1 from public.pr_reviews
      where pr_reviews.id = pr_program_data_cache.review_id
      and pr_reviews.user_id = auth.uid()
    )
  );

-- 5. Chat messages (Phase 2)
create table public.pr_chat_messages (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.pr_reviews on delete cascade not null,
  role text not null check (role in ('user', 'model')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.pr_chat_messages enable row level security;

create policy "Users can view own chat messages"
  on public.pr_chat_messages for select
  using (
    exists (
      select 1 from public.pr_reviews
      where pr_reviews.id = pr_chat_messages.review_id
      and pr_reviews.user_id = auth.uid()
    )
  );

create policy "Users can insert own chat messages"
  on public.pr_chat_messages for insert
  with check (
    exists (
      select 1 from public.pr_reviews
      where pr_reviews.id = pr_chat_messages.review_id
      and pr_reviews.user_id = auth.uid()
    )
  );

-- 6. KB files (Phase 2)
create table public.pr_kb_files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  program_name text not null,
  file_name text not null,
  file_type text,
  file_size integer,
  text_content text,
  created_at timestamptz default now()
);

alter table public.pr_kb_files enable row level security;

create policy "Users can view own KB files"
  on public.pr_kb_files for select
  using (auth.uid() = user_id);

create policy "Users can insert own KB files"
  on public.pr_kb_files for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own KB files"
  on public.pr_kb_files for delete
  using (auth.uid() = user_id);

-- 7. KB notes (Phase 2)
create table public.pr_kb_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  program_name text not null,
  content text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, program_name)
);

alter table public.pr_kb_notes enable row level security;

create policy "Users can view own KB notes"
  on public.pr_kb_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own KB notes"
  on public.pr_kb_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own KB notes"
  on public.pr_kb_notes for update
  using (auth.uid() = user_id);

-- Auto-update updated_at trigger
create or replace function public.pr_update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_pr_profiles_updated_at
  before update on public.pr_profiles
  for each row execute procedure public.pr_update_updated_at();

create trigger update_pr_reviews_updated_at
  before update on public.pr_reviews
  for each row execute procedure public.pr_update_updated_at();

create trigger update_pr_review_sections_updated_at
  before update on public.pr_review_sections
  for each row execute procedure public.pr_update_updated_at();

create trigger update_pr_program_data_cache_updated_at
  before update on public.pr_program_data_cache
  for each row execute procedure public.pr_update_updated_at();

create trigger update_pr_kb_notes_updated_at
  before update on public.pr_kb_notes
  for each row execute procedure public.pr_update_updated_at();

-- 8. Program Data Cache (Zogotech scraping)
create table public.program_data_cache (
  id uuid default gen_random_uuid() primary key,
  subject_code text not null unique,
  data jsonb not null,
  cached_at timestamptz default now(),
  expires_at timestamptz default now() + interval '30 days',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.program_data_cache enable row level security;

create policy "Anyone can read program data cache"
  on public.program_data_cache for select
  using (true);

create policy "Service role can manage program data cache"
  on public.program_data_cache for insert
  with check (true);

create policy "Service role can update program data cache"
  on public.program_data_cache for update
  using (true);

create trigger update_program_data_cache_updated_at
  before update on public.program_data_cache
  for each row execute procedure public.pr_update_updated_at();
