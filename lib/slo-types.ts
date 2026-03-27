import type { InstructionalDivision } from './tracking-schedule';

/** A course entry from the slo_course_list table */
export interface SLOCourseEntry {
  courseSubject: string;
  courseNumber: string;
  courseTitle: string | null;
  programName: string;
  division: string;
  facultyName: string | null;
  facultyId: string | null;
  academicYear: string;
}

/** Status stages for the SLO lifecycle */
export type SLOStatus = 'not_started' | 'in_progress' | 'assessed' | 'analyzed' | 'complete';

/** Course-level tracking status (returned by schedule API) */
export interface SLOCourseStatus {
  courseSubject: string;
  courseNumber: string;
  courseTitle: string | null;
  programName: string;
  division: string;
  facultyName: string | null;
  facultyId: string | null;
  status: SLOStatus;
  sloDefined: boolean;
  sloAssessed: boolean;
  resultsAnalyzed: boolean;
  improvementsMade: boolean;
  engagementCount: number;
  lastEngagementDate: string | null;
  notes: string;
}

/** Program-level rollup summary */
export interface SLOProgramSummary {
  programName: string;
  division: string;
  totalCourses: number;
  notStarted: number;
  inProgress: number;
  assessed: number;
  analyzed: number;
  complete: number;
  completionRate: number;
}

/** SLO assessment record (Phase 2 — from eLumen CSV) */
export interface SLOAssessmentRecord {
  studentId: string;
  ethnicity: string | null;
  ageGroup: string | null;
  gender: string | null;
  courseSubject: string;
  courseNumber: string;
  crn: string | null;
  facultyId: string | null;
  facultyName: string | null;
  sloDescription: string;
  masteryAchieved: boolean | null;
  masteryLevel: string | null;
  scores: number | null;
  possible: number | null;
  percentScore: number | null;
  academicYear: string;
  term: string | null;
}

/** Aggregated SLO data for charts */
export interface SLOAggregatedData {
  courseSubject: string;
  courseNumber: string;
  academicYear: string;
  totalAssessments: number;
  masteryRate: number;
  byEthnicity: { ethnicity: string; total: number; met: number; rate: number }[];
  byGender: { gender: string; total: number; met: number; rate: number }[];
  byAgeGroup: { ageGroup: string; total: number; met: number; rate: number }[];
  bySLO: { sloDescription: string; total: number; met: number; rate: number; levels: Record<string, number> }[];
}

/** SLO engagement types */
export type SLOEngagementType =
  | 'meeting'
  | 'email'
  | 'reminder'
  | 'training'
  | 'data_review'
  | 'assessment_submitted'
  | 'other';

export const SLO_ENGAGEMENT_TYPE_LABELS: Record<SLOEngagementType, string> = {
  meeting: '👥 Meeting',
  email: '✉️ Email',
  reminder: '🔔 Reminder',
  training: '📚 Training',
  data_review: '📊 Data Review',
  assessment_submitted: '✅ Assessment Submitted',
  other: '📝 Other',
};
