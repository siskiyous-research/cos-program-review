/**
 * POST /api/summary
 * Generates an executive summary of the program review
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExecutiveSummary } from '@/lib/gemini-service';
import { HistoricalReview } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { fullReviewText, historicalData, knowledgeBaseData } = await req.json();

    // Validate required fields
    if (!fullReviewText) {
      return NextResponse.json({ ok: false, error: 'Missing required field: fullReviewText' }, { status: 400 });
    }

    // Call Gemini service for summary generation
    const summary = await getExecutiveSummary(fullReviewText, (historicalData || []) as HistoricalReview[], knowledgeBaseData);

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate summary';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
