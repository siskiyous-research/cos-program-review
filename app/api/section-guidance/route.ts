/**
 * POST /api/section-guidance
 * Returns ACCJC-focused coaching guidance for a section draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSectionGuidance } from '@/lib/gemini-service';
import { requireAuth } from '@/lib/auth';
import { ProgramData } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;
  try {
    const { sectionId, sectionTitle, sectionContent, programData, programCategory } = await req.json();

    if (!sectionId || !sectionTitle || !sectionContent || !programData) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields: sectionId, sectionTitle, sectionContent, programData' },
        { status: 400 }
      );
    }

    const guidance = await getSectionGuidance(
      sectionId,
      sectionTitle,
      sectionContent,
      programData as ProgramData,
      programCategory
    );

    return NextResponse.json({ ok: true, guidance });
  } catch (error) {
    console.error('Error generating section guidance:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate guidance';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
