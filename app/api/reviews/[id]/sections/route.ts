import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user owns this review
  const { data: review } = await supabase
    .from('pr_reviews')
    .select('user_id')
    .eq('id', reviewId)
    .single();

  if (!review || review.user_id !== user.id) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const { data: sections, error } = await supabase
    .from('pr_review_sections')
    .select('*')
    .eq('review_id', reviewId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sections });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user owns this review
  const { data: review } = await supabase
    .from('pr_reviews')
    .select('user_id')
    .eq('id', reviewId)
    .single();

  if (!review || review.user_id !== user.id) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const { sectionId, content, citations, guidance } = await request.json();

  if (!sectionId) {
    return NextResponse.json({ ok: false, error: 'sectionId is required' }, { status: 400 });
  }

  const { data: section, error } = await supabase
    .from('pr_review_sections')
    .upsert(
      {
        review_id: reviewId,
        section_id: sectionId,
        content: content || '',
        citations: citations || null,
        guidance: guidance || null,
      },
      {
        onConflict: 'review_id,section_id',
      }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, section });
}
