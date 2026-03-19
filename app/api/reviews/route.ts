import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { data: reviews, error } = await supabase
    .from('pr_reviews')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reviews });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { programName, reviewType } = await request.json();

  if (!programName || !reviewType) {
    return NextResponse.json({ ok: false, error: 'programName and reviewType are required' }, { status: 400 });
  }

  // Check for existing draft review for this program+type
  const { data: existing } = await supabase
    .from('pr_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('program_name', programName)
    .eq('review_type', reviewType)
    .eq('status', 'draft')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, review: existing, isExisting: true });
  }

  // Create new review
  const { data: review, error } = await supabase
    .from('pr_reviews')
    .insert({
      user_id: user.id,
      program_name: programName,
      review_type: reviewType,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, review, isExisting: false });
}
