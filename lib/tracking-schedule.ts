export type InstructionalDivision = 'CTE' | 'LAS' | 'Athletics & Health' | 'Nursing';
export type NonInstructionalDivision = "President's Office" | 'Administrative Services' | 'Student Services' | 'Academic Affairs';

export type ScheduleEntry = {
  name: string;
  type: 'instructional' | 'non_instructional';
  division: InstructionalDivision | NonInstructionalDivision;
  years: Record<string, 'PR' | 'AU'>;
};

// Non-instructional division mapping
const NON_INSTRUCTIONAL_DIVISIONS: Record<string, NonInstructionalDivision> = {
  "President's Office": "President's Office",
  'Human Resources': "President's Office",
  'Institutional Research': "President's Office",
  'Public Information Office': "President's Office",

  'Administrative Services Division': 'Administrative Services',
  'Bookstore': 'Administrative Services',
  'Fiscal Services': 'Administrative Services',
  'Food Services': 'Administrative Services',
  'Maintenance/Operations/Transportation': 'Administrative Services',
  'Technology Services': 'Administrative Services',

  'Student Services Division': 'Student Services',
  'Admissions & Records': 'Student Services',
  'Financial Aid/Veterans/AB540': 'Student Services',
  'Basecamp': 'Student Services',
  'Student Equity & Achievement': 'Student Services',
  'Student Housing & Student Life': 'Student Services',
  'Counseling & Advising': 'Student Services',
  'Student Access Services': 'Student Services',
  'Outreach & Retention': 'Student Services',
  'Special Populations (EOPS/CARE/CalWORKs/NextUP/TRiO)': 'Student Services',
  'Student Services-AB19/Health/Mental Health': 'Student Services',
  'International Students': 'Student Services',

  'Academic Affairs Division': 'Academic Affairs',
  'Academic Success Center': 'Academic Affairs',
  'Distance Learning': 'Academic Affairs',
  'FIELD Program': 'Academic Affairs',
  'Dual Enrollment': 'Academic Affairs',
  'Faculty Diversity Internship Program (FDIP)': 'Academic Affairs',
  'Library': 'Academic Affairs',
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
    division: NON_INSTRUCTIONAL_DIVISIONS[name],
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
    division: NON_INSTRUCTIONAL_DIVISIONS[name],
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
    division: NON_INSTRUCTIONAL_DIVISIONS[name],
    years: {
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
    },
  })),
];

// Instructional division mapping
const INSTRUCTIONAL_DIVISIONS: Record<string, InstructionalDivision> = {
  'Alcohol & Drug Studies': 'CTE',
  'Administration of Justice': 'CTE',
  'Business & Computer Sciences': 'CTE',
  'Early Childhood Education': 'CTE',
  'EMS': 'CTE',
  'Fire': 'CTE',
  'Welding': 'CTE',
  'Nursing': 'Nursing',
  'Health/PE/Recreation': 'Athletics & Health',
  'Humanities & Social Sciences': 'LAS',
  'Fine & Performing Arts': 'LAS',
  'Math': 'LAS',
};

// Instructional programs
export const INSTRUCTIONAL_SCHEDULE: ScheduleEntry[] = [
  // CTE programs: 2-year PR cycle, PR in 2026-2027 → next 2028-2029
  ...[
    'Alcohol & Drug Studies',
    'Administration of Justice',
    'Business & Computer Sciences',
    'Early Childhood Education',
    'EMS',
    'Fire',
    'Nursing',
    'Welding',
  ].map((name): ScheduleEntry => ({
    name,
    type: 'instructional',
    division: INSTRUCTIONAL_DIVISIONS[name],
    years: {
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'PR',
      '2029-2030': 'AU',
    },
  })),
  // Non-CTE instructional: 4-year PR cycle
  ...[
    'Health/PE/Recreation',
    'Humanities & Social Sciences',
  ].map((name): ScheduleEntry => ({
    name,
    type: 'instructional',
    division: INSTRUCTIONAL_DIVISIONS[name],
    years: {
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
    },
  })),
  // Non-CTE instructional: 4-year PR cycle, offset
  ...[
    'Fine & Performing Arts',
    'Math',
  ].map((name): ScheduleEntry => ({
    name,
    type: 'instructional',
    division: INSTRUCTIONAL_DIVISIONS[name],
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
