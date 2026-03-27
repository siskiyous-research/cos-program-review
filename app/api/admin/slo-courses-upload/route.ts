/**
 * POST /api/admin/slo-courses-upload
 * Upload CSV of courses that need SLO tracking
 * Expected columns: Subject, Course Number, Course Title, Program, Division, Faculty Name, Faculty ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

interface CourseRow {
  course_subject: string;
  course_number: string;
  course_title: string | null;
  program_name: string;
  division: string;
  faculty_name: string | null;
  faculty_id: string | null;
  academic_year: string;
}

function parseCSV(text: string, academicYear: string): CourseRow[] {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

  // Auto-detect columns by header name patterns
  const subjectIdx = headers.findIndex(h => /^subject$|subject.*code|course.*subj/i.test(h));
  const numberIdx = headers.findIndex(h => /^number$|course.*num|^num$|^course_number$/i.test(h));
  const titleIdx = headers.findIndex(h => /title|course.*title|course.*name/i.test(h));
  const programIdx = headers.findIndex(h => /program|program.*name/i.test(h));
  const divisionIdx = headers.findIndex(h => /division|div|area/i.test(h));
  const facultyNameIdx = headers.findIndex(h => /faculty.*name|instructor|teacher/i.test(h));
  const facultyIdIdx = headers.findIndex(h => /faculty.*id|instructor.*id/i.test(h));

  // Subject & Course Number could be combined (e.g., "BIO-2800")
  const combinedIdx = headers.findIndex(h => /subject.*&.*course|subject.*course.*number|course/i.test(h));

  if (subjectIdx === -1 && combinedIdx === -1) {
    throw new Error(
      'Could not detect Subject column. Expected headers like: Subject, Course Number, Course Title, Program, Division, Faculty Name, Faculty ID'
    );
  }
  if (programIdx === -1) {
    throw new Error('Could not detect Program column');
  }
  if (divisionIdx === -1) {
    throw new Error('Could not detect Division column');
  }

  const rows: CourseRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim());

    let subject: string;
    let number: string;

    if (combinedIdx !== -1 && subjectIdx === -1) {
      // Combined format like "BIO-2800"
      const combined = cols[combinedIdx] || '';
      const parts = combined.split(/[-\s]+/);
      subject = (parts[0] || '').toUpperCase();
      number = parts[1] || '';
    } else {
      subject = (cols[subjectIdx] || '').toUpperCase();
      number = numberIdx !== -1 ? (cols[numberIdx] || '') : '';
    }

    if (!subject) continue;

    const program = cols[programIdx] || '';
    const division = cols[divisionIdx] || '';
    if (!program || !division) continue;

    rows.push({
      course_subject: subject,
      course_number: number,
      course_title: titleIdx !== -1 ? cols[titleIdx] || null : null,
      program_name: program,
      division,
      faculty_name: facultyNameIdx !== -1 ? cols[facultyNameIdx] || null : null,
      faculty_id: facultyIdIdx !== -1 ? cols[facultyIdIdx] || null : null,
      academic_year: academicYear,
    });
  }

  return rows;
}

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const academicYear = formData.get('academicYear') as string | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }
    if (!academicYear) {
      return NextResponse.json({ ok: false, error: 'Academic year is required' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text, academicYear);

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid course rows found in CSV' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Clear existing entries for this year before importing
    await supabase
      .from('slo_course_list')
      .delete()
      .eq('academic_year', academicYear);

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      const { error } = await supabase
        .from('slo_course_list')
        .upsert(batch, { onConflict: 'course_subject,course_number,academic_year' });

      if (error) {
        throw new Error(`Supabase upsert failed: ${error.message}`);
      }
    }

    const programs = [...new Set(rows.map(r => r.program_name))].sort();
    const divisions = [...new Set(rows.map(r => r.division))].sort();

    return NextResponse.json({
      ok: true,
      imported: rows.length,
      programs,
      divisions,
    });
  } catch (error) {
    console.error('SLO courses upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process SLO courses upload';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('slo_course_list')
      .select('course_subject, course_number, course_title, program_name, division, faculty_name, academic_year')
      .order('academic_year', { ascending: false })
      .order('program_name')
      .order('course_subject');

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch SLO courses';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
