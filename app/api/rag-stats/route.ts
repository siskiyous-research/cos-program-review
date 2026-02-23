/**
 * GET /api/rag-stats
 * Returns RAG data statistics for UI display
 */

import { NextResponse } from 'next/server';
import { getRAGStats } from '@/lib/rag-service';

export async function GET() {
  try {
    const stats = getRAGStats();
    return NextResponse.json({ ok: true, stats });
  } catch (error) {
    console.error('Error getting RAG stats:', error);
    return NextResponse.json({ ok: true, stats: { totalChunks: 0, bySource: {} } });
  }
}
