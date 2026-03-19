/**
 * POST /api/section-assistance
 * Generates AI assistance for a specific review section with ACCJC + RAG integration
 * Supports empty userNotes (draft-from-scratch mode) and returns citations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSectionAssistance } from '@/lib/gemini-service';
import { requireAuth } from '@/lib/auth';
import { ProgramData } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { sectionId, sectionTitle, sectionDescription, programData, userNotes, knowledgeBaseData, programCategory } = await req.json();

    // Validate required fields (userNotes can be empty)
    if (!sectionId || !sectionTitle || !programData) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: sectionId, sectionTitle, programData' },
        { status: 400 }
      );
    }

    // Call AI service with ACCJC + RAG context
    const result = await getSectionAssistance(
      sectionId,
      sectionTitle,
      sectionDescription || '',
      programData as ProgramData,
      userNotes || '',
      knowledgeBaseData,
      programCategory
    );

    return NextResponse.json({ ok: true, assistance: result.text, citations: result.citations });
  } catch (error) {
    console.error('Error generating section assistance:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate section assistance';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
