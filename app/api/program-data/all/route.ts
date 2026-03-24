/**
 * GET /api/program-data/all
 * Returns all cached program data for every subject
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AggregatedProgramData } from '@/lib/types';

export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('program_data_cache')
      .select('subject_code, data')
      .order('subject_code');

    if (error) throw new Error(error.message);

    const subjects = (data || []).map(row => ({
      subject: row.subject_code as string,
      data: row.data as AggregatedProgramData,
    }));

    return NextResponse.json({ ok: true, subjects });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch all program data';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
