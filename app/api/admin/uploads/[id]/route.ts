/**
 * Admin: Delete or update a specific KB upload
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteUpload, updateUpload, getUploadText } from '@/lib/kb-store';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteUpload(id);
    if (!deleted) {
      return NextResponse.json({ ok: false, error: 'Upload not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Admin upload delete error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete upload' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateUpload(id, body);
    if (!updated) {
      return NextResponse.json({ ok: false, error: 'Upload not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Admin upload update error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update upload' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const text = await getUploadText(id);
    if (text === null) {
      return NextResponse.json({ ok: false, error: 'Upload not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, text });
  } catch (error) {
    console.error('Admin upload get error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to get upload text' },
      { status: 500 }
    );
  }
}
