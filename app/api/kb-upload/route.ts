/**
 * KB Upload API
 * POST: accepts multipart/form-data with file(s) OR JSON with { url, program }
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractText, extractFromURL, estimateProcessingTime } from '@/lib/doc-parser';
import { addUpload, KBUploadEntry } from '@/lib/kb-store';

function generateId(): string {
  return `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // URL fetch mode
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { url, program } = body as { url: string; program: string };
      if (!url) {
        return NextResponse.json({ ok: false, error: 'URL is required' }, { status: 400 });
      }

      const startTime = Date.now();
      const result = await extractFromURL(url);
      const processingTime = (Date.now() - startTime) / 1000;

      const id = generateId();
      const entry: KBUploadEntry = {
        id,
        filename: new URL(url).hostname,
        fileType: 'url',
        fileSize: result.text.length,
        program: program || '',
        uploadedAt: new Date().toISOString(),
        textPreview: result.text.slice(0, 200),
        textLength: result.text.length,
      };

      addUpload(entry, result.text);

      return NextResponse.json({
        ok: true,
        files: [{
          id,
          name: entry.filename,
          type: 'url',
          size: result.text.length,
          textContent: result.text,
          processingTime,
        }],
      });
    }

    // File upload mode
    const formData = await request.formData();
    const program = (formData.get('program') as string) || '';
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ ok: false, error: 'No files provided' }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      const startTime = Date.now();
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const estimate = estimateProcessingTime(file.size, ext);

      const result = await extractText(buffer, file.name);
      const processingTime = (Date.now() - startTime) / 1000;

      const id = generateId();
      const entry: KBUploadEntry = {
        id,
        filename: file.name,
        fileType: ext,
        fileSize: file.size,
        program,
        uploadedAt: new Date().toISOString(),
        textPreview: result.text.slice(0, 200),
        textLength: result.text.length,
      };

      addUpload(entry, result.text);

      results.push({
        id,
        name: file.name,
        type: ext,
        size: file.size,
        textContent: result.text,
        processingTime,
        estimatedTime: estimate,
        pageCount: result.pageCount,
      });
    }

    return NextResponse.json({ ok: true, files: results });
  } catch (error) {
    console.error('KB upload error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
