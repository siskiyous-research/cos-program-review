import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseSubject = searchParams.get('subject');
  const courseNumber = searchParams.get('number');
  const academicYear = searchParams.get('year');

  if (!courseSubject || !courseNumber || !academicYear) {
    return NextResponse.json(
      { ok: false, error: 'subject, number, and year parameters are required' },
      { status: 400 }
    );
  }

  const { data: engagement, error } = await supabase
    .from('slo_engagement_log')
    .select('*')
    .eq('course_subject', courseSubject)
    .eq('course_number', courseNumber)
    .eq('academic_year', academicYear)
    .order('engagement_date', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, engagement });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { courseSubject, courseNumber, programName, academicYear, engagementType, engagementDate, notes } =
    await request.json();

  if (!courseSubject || !courseNumber || !programName || !academicYear || !engagementType) {
    return NextResponse.json(
      { ok: false, error: 'courseSubject, courseNumber, programName, academicYear, and engagementType are required' },
      { status: 400 }
    );
  }

  const { data: log, error } = await supabase
    .from('slo_engagement_log')
    .insert({
      course_subject: courseSubject,
      course_number: courseNumber,
      program_name: programName,
      academic_year: academicYear,
      engagement_type: engagementType,
      engagement_date: engagementDate || new Date().toISOString().split('T')[0],
      notes,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, log });
}
