import { createAdminClient } from '@/lib/supabase/admin';
import type { SLOCourseEntry, SLOCourseStatus, SLOStatus, SLOProgramSummary } from './slo-types';

/**
 * Fetch all SLO courses for a given academic year
 */
export async function getSLOCourses(year: string): Promise<SLOCourseEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('slo_course_list')
    .select('*')
    .eq('academic_year', year)
    .order('program_name')
    .order('course_subject')
    .order('course_number');

  if (error) {
    console.error('Error fetching SLO courses:', error);
    return [];
  }

  return (data || []).map((row) => ({
    courseSubject: row.course_subject,
    courseNumber: row.course_number,
    courseTitle: row.course_title,
    programName: row.program_name,
    division: row.division,
    facultyName: row.faculty_name,
    facultyId: row.faculty_id,
    academicYear: row.academic_year,
  }));
}

/**
 * Fetch SLO courses for a specific program
 */
export async function getSLOCoursesForProgram(programName: string, year: string): Promise<SLOCourseEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('slo_course_list')
    .select('*')
    .eq('academic_year', year)
    .eq('program_name', programName)
    .order('course_subject')
    .order('course_number');

  if (error) {
    console.error('Error fetching SLO courses for program:', error);
    return [];
  }

  return (data || []).map((row) => ({
    courseSubject: row.course_subject,
    courseNumber: row.course_number,
    courseTitle: row.course_title,
    programName: row.program_name,
    division: row.division,
    facultyName: row.faculty_name,
    facultyId: row.faculty_id,
    academicYear: row.academic_year,
  }));
}

/**
 * Fetch SLO courses for a specific division
 */
export async function getSLOCoursesByDivision(division: string, year: string): Promise<SLOCourseEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('slo_course_list')
    .select('*')
    .eq('academic_year', year)
    .eq('division', division)
    .order('program_name')
    .order('course_subject')
    .order('course_number');

  if (error) {
    console.error('Error fetching SLO courses for division:', error);
    return [];
  }

  return (data || []).map((row) => ({
    courseSubject: row.course_subject,
    courseNumber: row.course_number,
    courseTitle: row.course_title,
    programName: row.program_name,
    division: row.division,
    facultyName: row.faculty_name,
    facultyId: row.faculty_id,
    academicYear: row.academic_year,
  }));
}

/**
 * Get distinct divisions from the SLO course list for a year
 */
export async function getSLODivisions(year: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('slo_course_list')
    .select('division')
    .eq('academic_year', year);

  if (error) {
    console.error('Error fetching SLO divisions:', error);
    return [];
  }

  const unique = [...new Set((data || []).map((row) => row.division))];
  return unique.sort();
}

/**
 * Get distinct programs from the SLO course list for a year
 */
export async function getSLOPrograms(year: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('slo_course_list')
    .select('program_name')
    .eq('academic_year', year);

  if (error) {
    console.error('Error fetching SLO programs:', error);
    return [];
  }

  const unique = [...new Set((data || []).map((row) => row.program_name))];
  return unique.sort();
}

/**
 * Compute SLO status from lifecycle flags and engagement count
 */
export function computeSLOStatus(
  tracking: { slo_defined?: boolean; slo_assessed?: boolean; results_analyzed?: boolean; improvements_made?: boolean; status_override?: string | null } | null,
  engagementCount: number,
  hasAssessmentSubmitted: boolean
): SLOStatus {
  if (tracking?.status_override) {
    return tracking.status_override as SLOStatus;
  }
  if (tracking?.improvements_made || false) return 'complete';
  if (tracking?.results_analyzed || false) return 'analyzed';
  if (tracking?.slo_assessed || hasAssessmentSubmitted) return 'assessed';
  if ((tracking?.slo_defined || false) || engagementCount > 0) return 'in_progress';
  return 'not_started';
}

/**
 * Build program-level rollup summaries from course statuses
 */
export function buildProgramSummaries(courses: SLOCourseStatus[]): SLOProgramSummary[] {
  const programs = new Map<string, SLOProgramSummary>();

  for (const course of courses) {
    let summary = programs.get(course.programName);
    if (!summary) {
      summary = {
        programName: course.programName,
        division: course.division,
        totalCourses: 0,
        notStarted: 0,
        inProgress: 0,
        assessed: 0,
        analyzed: 0,
        complete: 0,
        completionRate: 0,
      };
      programs.set(course.programName, summary);
    }

    summary.totalCourses++;
    switch (course.status) {
      case 'not_started': summary.notStarted++; break;
      case 'in_progress': summary.inProgress++; break;
      case 'assessed': summary.assessed++; break;
      case 'analyzed': summary.analyzed++; break;
      case 'complete': summary.complete++; break;
    }
  }

  // Calculate completion rates
  for (const summary of programs.values()) {
    summary.completionRate = summary.totalCourses > 0
      ? Math.round((summary.complete / summary.totalCourses) * 100)
      : 0;
  }

  return Array.from(programs.values()).sort((a, b) => a.programName.localeCompare(b.programName));
}
