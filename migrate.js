const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wqziuuslzjyfgqsvvcca.supabase.co';
const accessToken = 'sbp_6d7ecfc54866d30015218026bb3baf308bac4267';

const supabase = createClient(supabaseUrl, accessToken, {
  auth: { persistSession: false },
  headers: { Authorization: `Bearer ${accessToken}` }
});

const sql = `
create table if not exists public.program_data_cache (
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
  on public.program_data_cache for select using (true);

create policy "Service role can manage program data cache"
  on public.program_data_cache for insert using (true);

create policy "Service role can update program data cache"
  on public.program_data_cache for update using (true);
`;

async function migrate() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) throw error;
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

migrate();
