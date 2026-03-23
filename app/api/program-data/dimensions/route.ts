/**
 * GET /api/program-data/dimensions
 * Returns cached filter dimension values (academic years, terms, depts, majors, course numbers)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('program_data_cache')
      .select('data')
      .eq('subject_code', '_dimensions')
      .single();

    if (error || !data) {
      return NextResponse.json({
        ok: false,
        error: 'NO_CACHED_DIMENSIONS',
        message: 'Filter dimensions not cached yet. Run a scrape first.',
      }, { status: 404 });
    }

    return NextResponse.json({ ok: true, dimensions: data.data });
  } catch (error) {
    console.error('Error fetching dimensions:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch dimensions' }, { status: 500 });
  }
}
