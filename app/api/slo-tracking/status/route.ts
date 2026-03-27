import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const {
    courseSubject, courseNumber, programName, academicYear,
    sloDefined, sloAssessed, resultsAnalyzed, improvementsMade,
    statusOverride, notes,
  } = await request.json();

  if (!courseSubject || !courseNumber || !programName || !academicYear) {
    return NextResponse.json(
      { ok: false, error: 'courseSubject, courseNumber, programName, and academicYear are required' },
      { status: 400 }
    );
  }

  // Try to get existing record
  const { data: existing } = await supabase
    .from('slo_course_tracking')
    .select('id')
    .eq('course_subject', courseSubject)
    .eq('course_number', courseNumber)
    .eq('academic_year', academicYear)
    .maybeSingle();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('slo_course_tracking')
      .update({
        slo_defined: sloDefined ?? undefined,
        slo_assessed: sloAssessed ?? undefined,
        results_analyzed: resultsAnalyzed ?? undefined,
        improvements_made: improvementsMade ?? undefined,
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
    const { data, error } = await supabase
      .from('slo_course_tracking')
      .insert({
        course_subject: courseSubject,
        course_number: courseNumber,
        program_name: programName,
        academic_year: academicYear,
        slo_defined: sloDefined || false,
        slo_assessed: sloAssessed || false,
        results_analyzed: resultsAnalyzed || false,
        improvements_made: improvementsMade || false,
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
