/**
 * POST /api/admin/program-data-scrape
 * Manual trigger to scrape and cache all program data from Zogotech
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { fetchProgramData } from '@/lib/program-data-queries';
import { saveProgramDataCache, getAllCachedSubjects, clearExpiredCache } from '@/lib/program-data-cache';
import { ALL_SUBJECT_CODES } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const subjects = ALL_SUBJECT_CODES;
    const results: Array<{ subject: string; success: boolean; error?: string }> = [];

    for (const subject of subjects) {
      try {
        const data = await fetchProgramData({ subject, yearsAgo: 4 });
        await saveProgramDataCache(subject, data);
        results.push({ subject, success: true });
        console.log(`✓ Cached data for ${subject}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.push({ subject, success: false, error: errorMsg });
        console.error(`✗ Failed to cache ${subject}: ${errorMsg}`);
      }
    }

    await clearExpiredCache();

    return NextResponse.json({
      ok: true,
      message: `Scrape completed: ${results.filter(r => r.success).length}/${results.length} successful`,
      results,
    });
  } catch (error) {
    console.error('Error during program data scrape:', error);
    const message = error instanceof Error ? error.message : 'Failed to scrape program data';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const cached = await getAllCachedSubjects();
    return NextResponse.json({
      ok: true,
      cached,
      totalCached: cached.length,
    });
  } catch (error) {
    console.error('Error fetching cache status:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch cache status';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
