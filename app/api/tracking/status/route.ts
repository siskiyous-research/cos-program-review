import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { programName, academicYear, programType, draftSubmitted, finalSubmitted, presented, statusOverride, notes } =
    await request.json();

  if (!programName || !academicYear || !programType) {
    return NextResponse.json(
      { ok: false, error: 'programName, academicYear, and programType are required' },
      { status: 400 }
    );
  }

  // First, try to get existing record
  const { data: existing } = await supabase
    .from('pr_program_tracking')
    .select('id')
    .eq('program_name', programName)
    .eq('academic_year', academicYear)
    .maybeSingle();

  let result;
  if (existing) {
    // Update existing record
    const { data, error } = await supabase
      .from('pr_program_tracking')
      .update({
        draft_submitted: draftSubmitted ?? undefined,
        final_submitted: finalSubmitted ?? undefined,
        presented: presented ?? undefined,
        status_override: statusOverride ?? undefined,
        notes: notes ?? undefined,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    result = data;
  } else {
    // Create new record
    const { data, error } = await supabase
      .from('pr_program_tracking')
      .insert({
        program_name: programName,
        program_type: programType,
        academic_year: academicYear,
        draft_submitted: draftSubmitted || false,
        final_submitted: finalSubmitted || false,
        presented: presented || false,
        status_override: statusOverride || null,
        notes: notes || null,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    result = data;
  }

  return NextResponse.json({ ok: true, data: result });
}
