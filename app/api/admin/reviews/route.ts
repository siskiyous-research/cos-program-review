/**
 * Admin: List review archive files from manifest
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'reviews', 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json({ ok: true, reviews: {} });
    }
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const reviews = JSON.parse(raw);
    return NextResponse.json({ ok: true, reviews });
  } catch (error) {
    console.error('Admin reviews list error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to list reviews' },
      { status: 500 }
    );
  }
}
