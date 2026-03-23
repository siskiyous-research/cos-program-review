/**
 * Maps review section IDs to relevant data view keys
 * Controls which charts appear in the slide-over panel for each section
 */

export type DataViewKey =
  | 'enrollment'
  | 'demographics'
  | 'gender'
  | 'ageGroups'
  | 'successFall'
  | 'successSpring'
  | 'successSummerWinter'
  | 'successByEthnicity'
  | 'modality'
  | 'retention'
  | 'highSchools'
  | 'ftes'
  | 'location'
  | 'degreeApplicableCourses'
  | 'notDegreeApplicableCourses';

const ALL_VIEWS: DataViewKey[] = [
  'enrollment', 'successFall', 'successSpring', 'successSummerWinter',
  'successByEthnicity', 'demographics', 'gender', 'ageGroups',
  'highSchools', 'modality', 'retention', 'location', 'ftes',
  'degreeApplicableCourses', 'notDegreeApplicableCourses',
];

export const SECTION_DATA_MAP: Record<string, DataViewKey[]> = {
  // === Annual Program Review ===
  program_info: ['enrollment', 'ftes', 'demographics', 'gender'],
  improvement_actions: ['successFall', 'successSpring', 'successByEthnicity', 'enrollment'],
  slo_assessment: ['successFall', 'successSpring', 'successByEthnicity'],
  support_obstacles: ['enrollment', 'ftes', 'modality'],
  budgetary_needs: ['ftes', 'enrollment'],
  closing_the_loop_annual: ['ftes', 'enrollment'],

  // === Comprehensive Instructional ===
  program_description: ['enrollment', 'demographics', 'gender', 'ageGroups', 'ftes', 'location', 'degreeApplicableCourses', 'notDegreeApplicableCourses'],
  external_factors: ['enrollment', 'ftes', 'modality', 'highSchools'],
  outcomes_assessment: ['successFall', 'successSpring', 'successSummerWinter', 'successByEthnicity'],
  effectiveness_indicators: ['successFall', 'successSpring', 'successByEthnicity', 'enrollment', 'ftes'],
  other_research: ALL_VIEWS,
  analysis: ALL_VIEWS,
  vision: ['enrollment', 'ftes', 'successFall', 'demographics'],
  prior_goals: ['successFall', 'successByEthnicity', 'enrollment', 'ftes'],
  action_plan: ALL_VIEWS,
  closing_loop: ['ftes', 'enrollment'],

  // === Comprehensive Non-Instructional ===
  ni_program_description: ['enrollment', 'demographics', 'gender', 'ageGroups', 'ftes', 'location'],
  ni_external_factors: ['enrollment', 'ftes', 'modality'],
  ni_outcomes_assessment: ['successFall', 'successSpring', 'successByEthnicity'],
  ni_quantitative_qualitative_data: ALL_VIEWS,
  ni_unit_specific_results: ['demographics', 'gender', 'ageGroups', 'highSchools'],
  ni_evaluation: ALL_VIEWS,
  ni_prior_goals: ['successFall', 'successByEthnicity', 'enrollment', 'ftes'],
  ni_closing_budget_loop: ['ftes', 'enrollment'],
  ni_vision: ['enrollment', 'ftes', 'successFall', 'demographics'],
  ni_action_plan: ALL_VIEWS,
  ni_conclusion: ['enrollment', 'ftes', 'successFall'],
};

export const DATA_VIEW_LABELS: Record<DataViewKey, string> = {
  enrollment: 'Enrollment Trend',
  successFall: 'Success Rates (Fall)',
  successSpring: 'Success Rates (Spring)',
  successSummerWinter: 'Success Rates (Summer/Winter)',
  successByEthnicity: 'Success by Ethnicity',
  demographics: 'Race/Ethnicity',
  gender: 'Gender',
  ageGroups: 'Age Groups',
  highSchools: 'High Schools (Top 20)',
  modality: 'Modality & Success',
  retention: 'Retention',
  location: 'Campus Code / Location',
  ftes: 'FTES Trend',
  degreeApplicableCourses: 'Degree Applicable Courses',
  notDegreeApplicableCourses: 'Non-Degree Applicable Courses',
};
