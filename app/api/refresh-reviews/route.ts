/**
 * POST /api/refresh-reviews
 * Re-scrapes program reviews from BoardDocs and downloads PDFs.
 * This runs the full pipeline: scrape → download → rebuild index.
 * Only works in local development (requires Playwright/Chromium).
 */

import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { requireAuth } from '@/lib/auth';

export async function POST() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const cwd = process.cwd();

    // Step 1: Re-scrape reviews from BoardDocs (Playwright)
    console.log('[refresh-reviews] Scraping reviews from BoardDocs...');
    execSync('npx tsx scripts/scrape/scrape-boarddocs-reviews.ts', {
      cwd,
      timeout: 600000,
      stdio: 'inherit',
    });

    // Step 2: Download PDFs and organize into public/reviews/
    console.log('[refresh-reviews] Downloading PDFs...');
    execSync('npx tsx scripts/download-review-pdfs.ts', {
      cwd,
      timeout: 300000,
      stdio: 'inherit',
    });

    // Step 3: Rebuild search index
    console.log('[refresh-reviews] Rebuilding search index...');
    execSync('npx tsx scripts/scrape/build-index.ts', {
      cwd,
      timeout: 60000,
      stdio: 'inherit',
    });

    return NextResponse.json({ ok: true, message: 'Reviews refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing reviews:', error);
    const message = error instanceof Error ? error.message : 'Failed to refresh reviews';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
