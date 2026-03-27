import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSLOCourses } from '@/lib/slo-schedule';
import { computeSLOStatus } from '@/lib/slo-schedule';
import type { SLOCourseStatus } from '@/lib/slo-types';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2025-2026';
  const division = searchParams.get('division');
  const program = searchParams.get('program');

  // Get courses from the uploaded course list
  let courses = await getSLOCourses(year);

  if (division) {
    courses = courses.filter((c) => c.division === division);
  }
  if (program) {
    courses = courses.filter((c) => c.programName === program);
  }

  // Fetch tracking status and engagement counts for each course
  const coursesWithStatus: SLOCourseStatus[] = await Promise.all(
    courses.map(async (course) => {
      const [trackingRes, engagementRes, assessmentSubmittedRes] = await Promise.all([
        supabase
          .from('slo_course_tracking')
          .select('*')
          .eq('course_subject', course.courseSubject)
          .eq('course_number', course.courseNumber)
          .eq('academic_year', year)
          .maybeSingle(),
        supabase
          .from('slo_engagement_log')
          .select('count', { count: 'exact', head: true })
          .eq('course_subject', course.courseSubject)
          .eq('course_number', course.courseNumber)
          .eq('academic_year', year),
        supabase
          .from('slo_engagement_log')
          .select('count', { count: 'exact', head: true })
          .eq('course_subject', course.courseSubject)
          .eq('course_number', course.courseNumber)
          .eq('academic_year', year)
          .eq('engagement_type', 'assessment_submitted'),
      ]);

      const tracking = trackingRes.data;
      const engagementCount = engagementRes.count || 0;
      const hasAssessmentSubmitted = (assessmentSubmittedRes.count || 0) > 0;

      const status = computeSLOStatus(tracking, engagementCount, hasAssessmentSubmitted);

      // Get most recent engagement
      const { data: lastEngagement } = await supabase
        .from('slo_engagement_log')
        .select('engagement_date')
        .eq('course_subject', course.courseSubject)
        .eq('course_number', course.courseNumber)
        .eq('academic_year', year)
        .order('engagement_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        courseSubject: course.courseSubject,
        courseNumber: course.courseNumber,
        courseTitle: course.courseTitle,
        programName: course.programName,
        division: course.division,
        facultyName: course.facultyName,
        facultyId: course.facultyId,
        status,
        sloDefined: tracking?.slo_defined || false,
        sloAssessed: tracking?.slo_assessed || hasAssessmentSubmitted,
        resultsAnalyzed: tracking?.results_analyzed || false,
        improvementsMade: tracking?.improvements_made || false,
        engagementCount,
        lastEngagementDate: lastEngagement?.engagement_date || null,
        notes: tracking?.notes || '',
      };
    })
  );

  return NextResponse.json({
    ok: true,
    year,
    courses: coursesWithStatus,
  });
}
