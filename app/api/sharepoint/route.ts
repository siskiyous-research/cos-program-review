import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSetting } from '@/lib/settings';

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
    const { fileName, content, programName, reviewType, folderPath } = await request.json();

    if (!fileName || !content) {
      return NextResponse.json(
        { ok: false, error: 'fileName and content are required' },
        { status: 400 }
      );
    }

    // Get notification settings
    const notifyName = await getSetting('notify_name') || '';
    const notifyEmail = await getSetting('notify_email') || '';

    // Build SharePoint link
    const spBase = 'https://siskiyous0.sharepoint.com/sites/ProgramReview';
    const cleanFolder = folderPath.replace(/^\//, '');
    const encodedPath = encodeURIComponent(`/sites/ProgramReview/${cleanFolder}/${fileName}`);
    const encodedParent = encodeURIComponent(`/sites/ProgramReview/${cleanFolder}`);
    const sharePointLink = `${spBase}/Shared%20Documents/Forms/AllItems.aspx?id=${encodedPath}&parent=${encodedParent}&p=true&ga=1`;

    const response = await fetch(POWER_AUTOMATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName, content, programName, reviewType, folderPath, notifyName, notifyEmail, sharePointLink }),
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
