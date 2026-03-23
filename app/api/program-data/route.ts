/**
 * GET /api/program-data
 * Retrieves cached program data from Supabase
 * Cached data is populated by periodic scraping script
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCachedProgramData } from '@/lib/program-data-cache';
import { AggregatedProgramData } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const searchParams = req.nextUrl.searchParams;
    const subject = searchParams.get('subject');

    if (!subject || !/^[A-Z0-9]{1,8}$/i.test(subject)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid subject code. Must be alphanumeric, 1-8 characters.' },
        { status: 400 }
      );
    }

    const data: AggregatedProgramData | null = await getCachedProgramData(subject.toUpperCase());

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error: 'NO_CACHED_DATA',
          message: 'No cached data available for this program. Please run the data scrape.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Error retrieving program data:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve program data';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
