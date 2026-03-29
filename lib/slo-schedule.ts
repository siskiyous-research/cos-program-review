import { createAdminClient } from '@/lib/supabase/admin';
import type { SLOCourseEntry } from './slo-types';

// Re-export client-safe utilities for server-side consumers
export { computeSLOStatus, buildProgramSummaries } from './slo-utils';

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

