import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const POWER_AUTOMATE_URL = process.env.POWER_AUTOMATE_WEBHOOK_URL;

export async function POST(request: Request) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  if (!POWER_AUTOMATE_URL) {
    return NextResponse.json(
      { ok: false, error: 'SharePoint integration not configured' },
      { status: 500 }
    );
  }

  try {
    const { fileName, content, programName, reviewType } = await request.json();

    if (!fileName || !content) {
      return NextResponse.json(
        { ok: false, error: 'fileName and content are required' },
        { status: 400 }
      );
    }

    const response = await fetch(POWER_AUTOMATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, content, programName, reviewType }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Power Automate error:', response.status, text);
      return NextResponse.json(
        { ok: false, error: 'Failed to save to SharePoint' },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('SharePoint save error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to save to SharePoint' },
      { status: 500 }
    );
  }
}
