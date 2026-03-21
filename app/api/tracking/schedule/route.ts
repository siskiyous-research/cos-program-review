import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProgramsForYear } from '@/lib/tracking-schedule';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2025-2026';
  const type = searchParams.get('type'); // 'instructional', 'non_instructional', or null for all

  // Get all programs for the year from static schedule
  let programs = getProgramsForYear(year);

  // Filter by type if specified
  if (type) {
    programs = programs.filter((p) => p.type === type);
  }

  // Fetch tracking status and engagement counts for each program
  const programsWithStatus = await Promise.all(
    programs.map(async (program) => {
      const [trackingRes, engagementRes] = await Promise.all([
        supabase
          .from('pr_program_tracking')
          .select('*')
          .eq('program_name', program.name)
          .eq('academic_year', year)
          .maybeSingle(),
        supabase
          .from('pr_engagement_log')
          .select('count', { count: 'exact', head: true })
          .eq('program_name', program.name)
          .eq('academic_year', year),
      ]);

      const tracking = trackingRes.data;
      const engagementCount = engagementRes.count || 0;

      // Compute status based on logic
      let status = 'red';
      if (tracking?.status_override) {
        status = tracking.status_override;
      } else if (tracking?.final_submitted || tracking?.draft_submitted) {
        status = 'green';
      } else if (engagementCount > 0) {
        status = 'yellow';
      }

      // Get most recent engagement
      const { data: lastEngagement } = await supabase
        .from('pr_engagement_log')
        .select('engagement_date')
        .eq('program_name', program.name)
        .eq('academic_year', year)
        .order('engagement_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        name: program.name,
        type: program.type,
        reviewType: program.years[year],
        status,
        draftSubmitted: tracking?.draft_submitted || false,
        finalSubmitted: tracking?.final_submitted || false,
        presented: tracking?.presented || false,
        engagementCount,
        lastEngagementDate: lastEngagement?.engagement_date || null,
        notes: tracking?.notes || '',
      };
    })
  );

  return NextResponse.json({
    ok: true,
    year,
    programs: programsWithStatus,
  });
}
