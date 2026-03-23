/**
 * POST /api/generate-program-data
 * Generates program data using AI, cached in Supabase for speed
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateProgramData } from '@/lib/gemini-service';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const { programName } = await req.json();

    if (!programName || typeof programName !== 'string') {
      return NextResponse.json({ ok: false, error: 'Invalid programName' }, { status: 400 });
    }

    // Check cache first
    const supabase = await createClient();
    const { data: cached } = await supabase
      .from('pr_program_data_simple_cache')
      .select('data')
      .eq('program_name', programName)
      .maybeSingle();

    if (cached?.data) {
      return NextResponse.json({ ok: true, data: cached.data });
    }

    // Generate and cache
    const data = await generateProgramData(programName);

    await supabase
      .from('pr_program_data_simple_cache')
      .upsert(
        { program_name: programName, data },
        { onConflict: 'program_name' }
      );

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Error generating program data:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate program data';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
