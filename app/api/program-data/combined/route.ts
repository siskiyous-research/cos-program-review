/**
 * GET /api/program-data/combined?subjects=SPAN,ASL
 * Returns aggregated data for multiple subject codes (for multi-subject programs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCachedProgramData, getFTESOverrides } from '@/lib/program-data-cache';
import { AggregatedProgramData } from '@/lib/types';
import { aggregateSubjects } from '@/lib/aggregate-program-data';

export async function GET(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const subjectsParam = req.nextUrl.searchParams.get('subjects');
    if (!subjectsParam) {
      return NextResponse.json(
        { ok: false, error: 'Missing subjects parameter. Provide comma-separated subject codes.' },
        { status: 400 }
      );
    }

    const subjects = subjectsParam.split(',').map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9]{1,10}$/.test(s));
    if (subjects.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No valid subject codes provided.' },
        { status: 400 }
      );
    }

    // Fetch each subject's cached data
    const allData: AggregatedProgramData[] = [];
    for (const subject of subjects) {
      const data = await getCachedProgramData(subject);
      if (data) {
        // Apply FTES overrides
        const ftesOverrides = await getFTESOverrides(subject);
        if (ftesOverrides.length > 0) data.ftes = ftesOverrides;
        allData.push(data);
      }
    }

    if (allData.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'NO_CACHED_DATA', message: 'No cached data for any of the requested subjects.' },
        { status: 404 }
      );
    }

    // If only one subject had data, return it directly
    if (allData.length === 1) {
      return NextResponse.json({ ok: true, data: allData[0] });
    }

    // Aggregate multiple subjects
    const combined = aggregateSubjects(allData, subjects.join(', '));
    return NextResponse.json({ ok: true, data: combined });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch combined program data';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
