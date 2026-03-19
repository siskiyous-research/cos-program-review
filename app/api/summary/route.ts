/**
 * POST /api/summary
 * Generates an executive summary of the program review with RAG context
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExecutiveSummary } from '@/lib/gemini-service';
import { requireAuth } from '@/lib/auth';
import { HistoricalReview } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const { fullReviewText, historicalData, knowledgeBaseData, programName, programCategory } = await req.json();

    // Validate required fields
    if (!fullReviewText) {
      return NextResponse.json({ ok: false, error: 'Missing required field: fullReviewText' }, { status: 400 });
    }

    // Call AI service for summary generation with RAG context
    const summary = await getExecutiveSummary(
      fullReviewText,
      (historicalData || []) as HistoricalReview[],
      knowledgeBaseData,
      programName,
      programCategory
    );

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate summary';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
