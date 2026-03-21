export type ScheduleEntry = {
  name: string;
  type: 'instructional' | 'non_instructional';
  years: Record<string, 'PR' | 'AU'>;
};

// Non-instructional programs
export const NON_INSTRUCTIONAL_SCHEDULE: ScheduleEntry[] = [
  // Group 1: PR cycle 2024-2025 → next 2028-2029
  ...[
    "President's Office",
    'Institutional Research',
    'Bookstore',
    'Student Services Division',
    'Library',
  ].map((name): ScheduleEntry => ({
    name,
    type: 'non_instructional',
    years: {
      '2025-2026': 'AU',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'PR',
      '2029-2030': 'AU',
    },
  })),
  // Group 2: PR cycle 2025-2026 → next 2029-2030
  ...[
    'Basecamp',
    'Counseling & Advising',
    'Academic Affairs Division',
    'Academic Success Center',
    'Distance Learning',
    'FIELD Program',
    'Dual Enrollment',
    'Public Information Office',
    'Administrative Services Division',
    'Maintenance/Operations/Transportation',
    'Technology Services',
    'Student Equity & Achievement',
    'Student Housing & Student Life',
    'Student Access Services',
    'Special Populations (EOPS/CARE/CalWORKs/NextUP/TRiO)',
  ].map((name): ScheduleEntry => ({
    name,
    type: 'non_instructional',
    years: {
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'PR',
    },
  })),
  // Group 3: PR cycle 2026-2027 → next 2030-2031
  ...[
    'Human Resources',
    'Fiscal Services',
    'Food Services',
    'Admissions & Records',
    'Financial Aid/Veterans/AB540',
    'Outreach & Retention',
    'Student Services-AB19/Health/Mental Health',
    'International Students',
    'Faculty Diversity Internship Program (FDIP)',
  ].map((name): ScheduleEntry => ({
    name,
    type: 'non_instructional',
    years: {
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
    },
  })),
];

// Instructional programs
export const INSTRUCTIONAL_SCHEDULE: ScheduleEntry[] = [
  // Group 1: PR cycle 2026-2027 → next ~2030-2031
  ...[
    'Alcohol & Drug Studies',
    'Administration of Justice',
    'Business & Computer Sciences',
    'Early Childhood Education',
    'EMS',
    'Fire',
    'Health/PE/Recreation',
    'Humanities & Social Sciences',
    'Nursing',
    'Welding',
  ].map((name): ScheduleEntry => ({
    name,
    type: 'instructional',
    years: {
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
    },
  })),
  // Group 2: PR cycle 2027-2028 → next ~2031-2032
  ...[
    'Fine & Performing Arts',
    'Math',
  ].map((name): ScheduleEntry => ({
    name,
    type: 'instructional',
    years: {
      '2025-2026': 'AU',
      '2026-2027': 'AU',
      '2027-2028': 'PR',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
    },
  })),
];

// Helper function to get all programs for a given year
export function getProgramsForYear(year: string): ScheduleEntry[] {
  const allPrograms = [...INSTRUCTIONAL_SCHEDULE, ...NON_INSTRUCTIONAL_SCHEDULE];
  return allPrograms.filter((program) => program.years[year]);
}

// Helper function to get all unique years
export function getAllYears(): string[] {
  const allPrograms = [...INSTRUCTIONAL_SCHEDULE, ...NON_INSTRUCTIONAL_SCHEDULE];
  const yearsSet = new Set<string>();
  allPrograms.forEach((program) => {
    Object.keys(program.years).forEach((year) => yearsSet.add(year));
  });
  return Array.from(yearsSet).sort();
}

// Get current/next year for the season
export function getCurrentAcademicYear(): string {
  return '2025-2026';
}
