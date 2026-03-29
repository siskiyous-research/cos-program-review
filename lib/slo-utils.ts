import type { SLOCourseStatus, SLOStatus, SLOProgramSummary } from './slo-types';

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
