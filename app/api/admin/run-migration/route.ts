/**
 * POST /api/admin/run-migration
 * Runs the ftes_override table migration via Supabase Management API
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSetting } from '@/lib/settings';

const MIGRATION_SQL = `
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ftes_override' AND policyname = 'Anyone can read ftes_override') THEN
    CREATE POLICY "Anyone can read ftes_override" ON public.ftes_override FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ftes_override' AND policyname = 'Service role can insert ftes_override') THEN
    CREATE POLICY "Service role can insert ftes_override" ON public.ftes_override FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ftes_override' AND policyname = 'Service role can update ftes_override') THEN
    CREATE POLICY "Service role can update ftes_override" ON public.ftes_override FOR UPDATE USING (true);
  END IF;
END $$;
`;

export async function POST() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const accessToken = await getSetting('supabase_access_token');
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: 'Supabase access token not configured. Set it in Settings.' },
        { status: 400 }
      );
    }

    // Extract project ref from Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!match) {
      return NextResponse.json(
        { ok: false, error: 'Could not extract project ref from SUPABASE_URL' },
        { status: 400 }
      );
    }
    const projectRef = match[1];

    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: MIGRATION_SQL }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, error: `Migration failed (${res.status}): ${text}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: 'ftes_override table created successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Migration failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
