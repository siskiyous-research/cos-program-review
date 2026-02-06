/**
 * POST /api/generate-program-data
 * Generates realistic program data using Gemini API
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateProgramData } from '@/lib/gemini-service';

export async function POST(req: NextRequest) {
  try {
    const { programName } = await req.json();

    if (!programName || typeof programName !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid programName' }, { status: 400 });
    }

    const data = await generateProgramData(programName);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Error generating program data:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate program data';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
