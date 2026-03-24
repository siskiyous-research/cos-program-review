/**
 * POST /api/chat
 * Handles chat messages with program context + RAG
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChatResponse } from '@/lib/gemini-service';
import { requireAuth } from '@/lib/auth';
import { ProgramData, ChatMessage, AggregatedProgramData } from '@/lib/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { aggregateSubjects } from '@/lib/aggregate-program-data';
import { getFTESOverrides } from '@/lib/program-data-cache';

// Cache college-wide data in memory (refreshes every 10 minutes)
let collegeDataCache: { data: AggregatedProgramData; expiry: number } | null = null;

async function getCollegeWideData(): Promise<AggregatedProgramData | null> {
  if (collegeDataCache && Date.now() < collegeDataCache.expiry) {
    return collegeDataCache.data;
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('program_data_cache')
      .select('subject_code, data')
      .order('subject_code');
    if (error || !data) return null;

    const validRows = data.filter(row => /^[A-Z]{2,10}$/.test(row.subject_code));
    const allSubjects: AggregatedProgramData[] = await Promise.all(
      validRows.map(async (row) => {
        const pd = row.data as AggregatedProgramData;
        const overrides = await getFTESOverrides(row.subject_code);
        if (overrides.length > 0) pd.ftes = overrides;
        return pd;
      })
    );

    const aggregated = aggregateSubjects(allSubjects, 'College-Wide');
    collegeDataCache = { data: aggregated, expiry: Date.now() + 10 * 60 * 1000 };
    return aggregated;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { message, chatHistory, programData, knowledgeBaseData, programCategory, aggregatedData } = await req.json();

    // Validate required fields
    if (!message || !programData) {
      return NextResponse.json({ ok: false, error: 'Missing required fields: message, programData' }, { status: 400 });
    }

    // Fetch college-wide data for comparisons (cached in memory)
    const collegeWideData = await getCollegeWideData();

    // Call AI service for chat response with RAG context
    const result = await getChatResponse(
      message,
      programData as ProgramData,
      (chatHistory || []) as ChatMessage[],
      knowledgeBaseData,
      programCategory,
      aggregatedData || null,
      collegeWideData
    );

    return NextResponse.json({ ok: true, response: result.text, citations: result.citations });
  } catch (error) {
    console.error('Error getting chat response:', error);
    const message = error instanceof Error ? error.message : 'Failed to get chat response';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
