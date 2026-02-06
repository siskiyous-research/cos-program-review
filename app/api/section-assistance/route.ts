/**
 * POST /api/section-assistance
 * Generates AI assistance for a specific review section with ACCJC integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSectionAssistance } from '@/lib/gemini-service';
import { ProgramData } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { sectionId, sectionTitle, sectionDescription, programData, userNotes, knowledgeBaseData } = await req.json();

    // Validate required fields
    if (!sectionId || !sectionTitle || !programData || !userNotes) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: sectionId, sectionTitle, programData, userNotes' },
        { status: 400 }
      );
    }

    // Call Gemini service with ACCJC context automatically included
    const assistance = await getSectionAssistance(sectionId, sectionTitle, sectionDescription || '', programData as ProgramData, userNotes, knowledgeBaseData);

    return NextResponse.json({ ok: true, assistance });
  } catch (error) {
    console.error('Error generating section assistance:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate section assistance';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
