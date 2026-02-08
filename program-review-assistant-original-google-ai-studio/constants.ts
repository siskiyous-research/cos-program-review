import { ReviewTemplateItem } from './types';

export const ANNUAL_PROGRAM_REVIEW_TEMPLATE: ReviewTemplateItem[] = [
  {
    id: 'program_info',
    title: 'Program & Staffing Information',
    description: 'Provide Program Name, Academic Year, Person Completing Update, and numbers for full-time faculty, part-time faculty, and staff. Also note if these numbers reflect any staffing changes.',
  },
  {
    id: 'improvement_actions',
    title: 'Improvement Actions from Comprehensive Review',
    description: 'Refer to the most recent Comprehensive Program Review, what were the identified actions for improvement? Identify any current and/or new strategies that have been implemented.',
  },
  {
    id: 'slo_assessment',
    title: 'Progress on Assessing Outcomes',
    description: 'Describe your progress on assessing Student Learning Outcomes/Service Area Outcomes, and PLOs.',
  },
  {
    id: 'support_obstacles',
    title: 'Support and Obstacles',
    description: 'Discuss any support or obstacles encountered by the program.',
  },
  {
    id: 'budgetary_needs',
    title: 'Budgetary Needs or Implications (RAR)',
    description: 'Describe program budgetary needs or implications. Submit a Resource Allocation Request [RAR] if you are requesting a budget allocation that falls outside of regular yearly budget allocations.',
  },
  {
    id: 'closing_the_loop_annual',
    title: 'Closing the Loop (RARs)',
    description: 'In the last year, were any of your program RARs approved? If so, how did this additional budget allocation improve or support your program?',
  },
];


export const COMPREHENSIVE_PROGRAM_REVIEW_TEMPLATE: ReviewTemplateItem[] = [
  {
    id: 'program_description',
    title: 'Description of Program',
    description: "Assume the reader doesn't know anything about your program. Describe your program, including: Organization (staffing and structure), Primary purpose, Whom you serve (including demographics), What kind of services you provide, How you provide them (courses), curriculum status, and a breakdown of classes offered.",
  },
  {
    id: 'external_factors',
    title: 'External Factors with Significant Impact',
    description: 'What external factors have a significant impact on your program? Include budgetary constraints, competition, requirements of four-year institutions, institutional and non-institutional regulations, and the job market.',
  },
  {
    id: 'outcomes_assessment',
    title: 'Outcomes Assessment Analysis',
    description: "Summarize assessment activities since the last program review, describe changes implemented as a result of improvement planning, and describe the program's assessment plan for the next four years.",
  },
  {
    id: 'effectiveness_indicators',
    title: 'Institutional Program Effectiveness Indicators',
    description: "Discuss your program's performance on data provided by the Research Office, including: Course Completion Rate, Course Success Rate, and FT/PT Faculty Ratio. Set goals for the next review cycle.",
  },
  {
    id: 'other_research',
    title: 'Other Unit-Specific Quantitative and Qualitative Research',
    description: 'Provide a list of any other quantitative or qualitative measures you use to gauge effectiveness. Summarize the results and what you learned from your evaluation.',
  },
  {
    id: 'analysis',
    title: 'Analysis',
    description: 'Provide an analysis of what is going well and why and what is not going well and why, in areas such as: representativeness of population, delivery modes, partnerships, innovation, efficiency, staffing, shared governance, training, and compliance.',
  },
  {
    id: 'vision',
    title: 'Vision',
    description: "Tell us your unit's vision. Where would you like your program to be four years from now?",
  },
  {
    id: 'prior_goals',
    title: 'Progress on Prior Goals',
    description: "Briefly summarize any progress your unit has made in meeting the goals and objectives identified in the program's last Four-Year Action Plan.",
  },
  {
    id: 'action_plan',
    title: 'Four Year-Action Plan and Resource Allocation Request (RAR)',
    description: 'Reflect on your responses to all the previous questions. Write a Four-Year Action Plan, entering the specific program goals you have formulated. Complete a RAR for each new budget allocation request.',
  },
  {
    id: 'closing_loop',
    title: 'Closing the loop',
    description: 'In the last cycle, were any of your program RARs approved? If so, how did this additional budget allocation improve or support your program?',
  },
];

export const NON_INSTRUCTIONAL_COMPREHENSIVE_TEMPLATE: ReviewTemplateItem[] = [
  {
    id: 'ni_program_description',
    title: 'Description of Program',
    description: "Describe your program, including: Mission, Organizational structure and staffing, Who you serve, Services you provide (with trend data), and Operations as a percent of the college's budget.",
  },
  {
    id: 'ni_external_factors',
    title: 'External Factors with Significant Impact',
    description: 'What external factors have a significant impact on your department? Include budgetary constraints, competition, requirements from other institutions or regulations, and the job market.',
  },
  {
    id: 'ni_outcomes_assessment',
    title: "Progress on Outcomes Assessments (SAO's or SLO's)",
    description: "Summarize Service Area Outcome (SAO) assessment results, including a discussion of whether targets were met. Describe any planned improvements and new objectives or action steps. If your program has SLOs, address this for SLOs as well.",
  },
  {
    id: 'ni_quantitative_qualitative_data',
    title: 'Quantitative & Qualitative Data',
    description: "Discuss your program's performance, including the Non-Instructional Program Effectiveness Evaluation. Describe new ideas/improvements, data used to verify them, and any partnerships that improve service quality.",
  },
  {
    id: 'ni_unit_specific_results',
    title: 'Unit-Specific Quantitative and Qualitative Results',
    description: "Discuss how your program's student demographics relate to the college demographics. Summarize results from any other measures used to gauge effectiveness and describe improvements implemented or planned based on your analysis.",
  },
  {
    id: 'ni_evaluation',
    title: 'Evaluation',
    description: 'Provide an analysis of what is going well and not well in areas such as: service delivery times/methods, use of new ideas, operational efficiency, resource use, staffing, decision-making involvement, training, and regulatory compliance.',
  },
  {
    id: 'ni_prior_goals',
    title: 'Progress on Prior Goals',
    description: "Briefly summarize the progress your unit has made in meeting the goals and objectives identified in your last Four-Year Action Plan.",
  },
  {
    id: 'ni_closing_budget_loop',
    title: 'Closing the Budget Loop',
    description: 'In the last cycle, were any of your program Resource Allocation Requests (RARs) approved? If so, how did this additional budget allocation improve or support your program/department?',
  },
  {
    id: 'ni_vision',
    title: 'Vision',
    description: "Tell us your unit's Vision. Where would you like your program to be four years from now? How does your vision align with the college Vision?",
  },
  {
    id: 'ni_action_plan',
    title: 'Four-Year Action Plan',
    description: 'Reflect on your responses to formulate program goals and objectives for your Four-Year Action Plan. Consider assessment results when developing resource requests and assign priorities.',
  },
  {
    id: 'ni_conclusion',
    title: 'Conclusion',
    description: 'Briefly summarize the most significant achievements or outcomes of the review. Highlight successes and mention any areas identified for improvement or growth.',
  },
];

export const PROGRAM_LIST = {
  instructional: [
    'Alcohol & Drug Studies (ADHS)',
    'Administration of Justice',
    'Business and Computer Sciences',
    'Early Childhood Education',
    'Emergency Medical Services (EMS)',
    'Fine and Performing Arts',
    'Fire',
    'Health, Physical Education and Recreation',
    'Humanities and Social Sciences',
    'Math',
    'Modern Languages',
    'Non-Credit',
    'Nursing',
    'Sciences',
    'Welding',
  ],
  academicAffairs: [
    'Academic Affairs Division',
    'Academic Success Center (ASC)',
    'Distance Learning',
    'FIELD Program (ISA)',
    'Dual Enrollment',
    'Library',
  ],
  presidentsOffice: [
    "President's Office",
    'Human Resources',
    'Institutional Research',
    'Public Information Office',
  ],
  administrativeServices: [
    'Administrative Services Division',
    'Bookstore',
    'Fiscal Services',
    'Food Services',
    'Maintenance, Operations & Transportation',
    'Technology Services',
  ],
  studentServices: [
    'Student Services Division',
    'Admissions and Records',
    'Financial Aid, Veterans and AB540',
    'Basecamp',
    'Student Equity & Achievement',
    'Student Housing',
    'Counseling & Advising - Transfer & Orientation',
    'Student Access Services',
    'Outreach & Retention',
    'Special Populations – EOPS, CARE CalWORKs, NextUP, TRIO',
    'Student Services – AB 19, Health Clinic, International Students, Mental Health',
    'Student Life',
  ],
};