/**
 * Admin: List all KB uploads
 */

import { NextResponse } from 'next/server';
import { listUploads } from '@/lib/kb-store';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const uploads = await listUploads();
    return NextResponse.json({ ok: true, uploads });
  } catch (error) {
    console.error('Admin uploads list error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to list uploads' },
      { status: 500 }
    );
  }
}
