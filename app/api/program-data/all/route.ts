/**
 * GET /api/program-data/all
 * Returns all cached program data for every subject
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AggregatedProgramData } from '@/lib/types';
import { getFTESOverrides } from '@/lib/program-data-cache';

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

    // Filter to valid subject codes (uppercase alpha, no special rows like "dimensions")
    const validRows = (data || []).filter(row =>
      /^[A-Z]{2,10}$/.test(row.subject_code)
    );

    const subjects = await Promise.all(
      validRows.map(async (row) => {
        const programData = row.data as AggregatedProgramData;
        // Apply FTES overrides if available
        const ftesOverrides = await getFTESOverrides(row.subject_code);
        if (ftesOverrides.length > 0) {
          programData.ftes = ftesOverrides;
        }
        return {
          subject: row.subject_code as string,
          data: programData,
        };
      })
    );

    return NextResponse.json({ ok: true, subjects });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch all program data';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
