export type ScheduleEntry = {
  name: string;
  type: 'instructional' | 'non_instructional';
  years: Record<string, 'PR' | 'AU'>;
};

// Non-instructional programs: Years 2023-2024 through 2030-2031
export const NON_INSTRUCTIONAL_SCHEDULE: ScheduleEntry[] = [
  {
    name: "President's Office",
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'AU',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Institutional Research',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'AU',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Bookstore',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'AU',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Student Services Division',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'AU',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Basecamp',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Counseling & Advising',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Academic Affairs Division',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Academic Success Center',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Distance Learning',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'FIELD Program',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Dual Enrollment',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Library',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'PR',
      '2025-2026': 'AU',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Public Information Office',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Administrative Services Division',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Maintenance/Operations/Transportation',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Technology Services',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Student Equity & Achievement',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Student Housing & Student Life',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Student Access Services',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Special Populations (EOPS/CARE/CalWORKs/NextUP/TRiO)',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'PR',
      '2026-2027': 'AU',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Human Resources',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Fiscal Services',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Food Services',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Admissions & Records',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Financial Aid/Veterans/AB540',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Outreach & Retention',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Student Services-AB19/Health/Mental Health',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'International Students',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
  {
    name: 'Faculty Diversity Internship Program (FDIP)',
    type: 'non_instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
      '2028-2029': 'AU',
      '2029-2030': 'AU',
      '2030-2031': 'AU',
    },
  },
];

// Instructional programs: Years 2023-2024 through 2027-2028
export const INSTRUCTIONAL_SCHEDULE: ScheduleEntry[] = [
  {
    name: 'Alcohol & Drug Studies',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
    },
  },
  {
    name: 'Administration of Justice',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
    },
  },
  {
    name: 'Business & Computer Sciences',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
    },
  },
  {
    name: 'Early Childhood Education',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
    },
  },
  {
    name: 'EMS',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
    },
  },
  {
    name: 'Fire',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
    },
  },
  {
    name: 'Health/PE/Recreation',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
    },
  },
  {
    name: 'Humanities & Social Sciences',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
    },
  },
  {
    name: 'Nursing',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
    },
  },
  {
    name: 'Welding',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'PR',
      '2027-2028': 'AU',
    },
  },
  {
    name: 'Fine & Performing Arts',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'AU',
      '2027-2028': 'PR',
    },
  },
  {
    name: 'Math',
    type: 'instructional',
    years: {
      '2023-2024': 'AU',
      '2024-2025': 'AU',
      '2025-2026': 'AU',
      '2026-2027': 'AU',
      '2027-2028': 'PR',
    },
  },
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
