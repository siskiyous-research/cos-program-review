/**
 * POST /api/admin/ftes-upload
 * Upload Banner FTES CSV to override Zogotech estimates
 * Supports wide format: Subject | 2021-22 | 2022-23 | ... (year columns with FTES values)
 * Also supports long format: Subject | Academic Year | FTES
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

interface FTESRow {
  subject_code: string;
  academic_year: string;
  ftes: number;
}

function parseCSV(text: string): FTESRow[] {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  // Split by comma or tab
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim());

  // Detect format: wide (year columns) vs long (Subject, Academic Year, FTES)
  const yearPattern = /^\d{4}-\d{2,4}$/;
  const yearColumns = headers
    .map((h, i) => ({ header: h, index: i }))
    .filter(({ header }) => yearPattern.test(header));

  if (yearColumns.length > 0) {
    // Wide format: Subject | 2021-22 | 2022-23 | ...
    const subjectIdx = headers.findIndex(h => /subject/i.test(h));
    if (subjectIdx === -1) {
      // Assume first column is subject
    }
    const sIdx = subjectIdx !== -1 ? subjectIdx : 0;

    const rows: FTESRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim());
      const subject = cols[sIdx]?.toUpperCase();
      if (!subject) continue;

      for (const { header, index } of yearColumns) {
        const val = parseFloat(cols[index]);
        if (!isNaN(val)) {
          rows.push({
            subject_code: subject,
            academic_year: header,
            ftes: val,
          });
        }
      }
    }
    return rows;
  }

  // Long format: Subject, Academic Year, FTES
  const subjectIdx = headers.findIndex(h => /subject/i.test(h));
  const yearIdx = headers.findIndex(h => /year/i.test(h));
  const ftesIdx = headers.findIndex(h => /ftes|fte/i.test(h));

  if (subjectIdx === -1 || yearIdx === -1 || ftesIdx === -1) {
    throw new Error(
      'Could not detect CSV format. Expected either wide format (Subject, 2021-22, 2022-23, ...) ' +
      'or long format (Subject, Academic Year, FTES)'
    );
  }

  const rows: FTESRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim());
    const subject = cols[subjectIdx]?.toUpperCase();
    const year = cols[yearIdx];
    const ftes = parseFloat(cols[ftesIdx]);

    if (!subject || !year || isNaN(ftes)) continue;
    rows.push({ subject_code: subject, academic_year: year, ftes });
  }
  return rows;
}

export async function POST(req: NextRequest) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid FTES rows found in CSV' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).map(r => ({
        ...r,
        source: 'banner',
        uploaded_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('ftes_override')
        .upsert(batch, { onConflict: 'subject_code,academic_year' });

      if (error) {
        throw new Error(`Supabase upsert failed: ${error.message}`);
      }
    }

    const subjects = [...new Set(rows.map(r => r.subject_code))].sort();

    return NextResponse.json({
      ok: true,
      imported: rows.length,
      subjects,
    });
  } catch (error) {
    console.error('FTES upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process FTES upload';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('ftes_override')
      .select('subject_code, academic_year, ftes, uploaded_at')
      .order('subject_code')
      .order('academic_year');

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch FTES overrides';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
