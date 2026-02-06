/**
 * ACCJC Standards Integration Utilities
 * Provides helper functions to map review sections to ACCJC standards
 * and retrieve compliance guidance
 */

import { AccjcStandard } from './types';

// Import the ACCJC standards data
const accjcData = {
  version: '2024',
  standards: [
    {
      id: 'I',
      title: 'Mission, Academic Quality and Institutional Effectiveness',
      description:
        'The institution demonstrates strong commitment to a clearly stated mission that guides institutional planning and operations. It has measurable student learning outcomes and evaluates its effectiveness in achieving them.',
      substandards: [
        { id: 'I.A', title: 'Mission', description: 'The institution has a clearly defined, widely published mission that guides its operations.' },
        {
          id: 'I.B',
          title: 'Assuring Academic Quality and Institutional Effectiveness',
          description: 'The institution assures the quality of its educational offerings through its evaluation of how well student learning is being achieved.',
        },
        {
          id: 'I.C',
          title: 'Institutional Planning and Effectiveness',
          description: 'The institution conducts planning and institutional effectiveness evaluation of relevant, accessible, and reliable information.',
        },
      ],
      reviewSections: ['program_description', 'external_factors', 'outcomes_assessment', 'effectiveness_indicators', 'other_research', 'analysis', 'planning_agenda'],
      keyQuestions: [
        'Does the program review address the institution\'s mission?',
        'Are learning outcomes clearly defined and assessed?',
        'Are the effectiveness indicators tracked and analyzed?',
        'How does the program contribute to institutional goals?',
      ],
    },
    {
      id: 'II',
      title: 'Student Learning and Support Services',
      description:
        'The institution provides learning opportunities and student support services appropriate to its mission. Institutions ensure that students are prepared to succeed in a complex society and economy.',
      substandards: [
        {
          id: 'II.A',
          title: 'Instructional Programs',
          description: 'The institution offers instructional programs, including general education, in formats and locations that accommodate student diversity and needs.',
        },
        {
          id: 'II.B',
          title: 'Library and Learning Support Services',
          description: 'The institution provides library and learning support services to support student needs and learning.',
        },
        {
          id: 'II.C',
          title: 'Student Support Services',
          description: 'The institution provides appropriate, comprehensive, and accessible student support services.',
        },
      ],
      reviewSections: ['slo_assessment', 'support_obstacles', 'closing_the_loop_annual'],
      keyQuestions: [
        'Are student learning outcomes being assessed?',
        'What support services are available to students?',
        'How are assessment results used to improve programs?',
        'Are there adequate resources for student success?',
      ],
    },
    {
      id: 'III',
      title: 'Resources',
      description: 'The institution effectively uses all of its resources to achieve its mission and to ensure the quality, stability, and integrity of its educational programs and services.',
      substandards: [
        { id: 'III.A', title: 'Human Resources', description: 'The institution employs a sufficient number of qualified personnel to carry out its mission.' },
        {
          id: 'III.B',
          title: 'Physical Resources and Facilities',
          description: 'The institution has appropriate physical resources and facilities to support its mission and ensure the safety and well-being of its students.',
        },
        {
          id: 'III.C',
          title: 'Technology Resources and Support',
          description: 'The institution ensures adequate technology resources and support for teaching, learning, and institutional operations.',
        },
        {
          id: 'III.D',
          title: 'Financial Resources',
          description: 'The institution allocates and manages its financial resources to support student learning programs and services and to improve institutional effectiveness.',
        },
      ],
      reviewSections: ['budgetary_needs', 'closing_the_loop_annual', 'effectiveness_indicators', 'improvement_actions'],
      keyQuestions: [
        'Does the program have sufficient staff and resources?',
        'Are facilities adequate for the program\'s needs?',
        'Are technology resources sufficient?',
        'Is the budget allocation aligned with program goals?',
        'What RAR (Resource Allocation Request) needs exist?',
      ],
    },
    {
      id: 'IV',
      title: 'Leadership and Governance',
      description:
        'The institution demonstrates effective overall planning, leadership, and governance structures that promote student learning and accomplishment of mission through collaborative processes that involve the broad college community.',
      substandards: [
        {
          id: 'IV.A',
          title: 'Decision-Making Roles and Processes',
          description: 'The institution has a clear system of governance with defined roles and responsibilities that supports effective decision-making and planning.',
        },
        {
          id: 'IV.B',
          title: 'Chief Executive Officer',
          description: 'The institution\'s chief executive officer provides effective leadership in planning, governance, and institutional improvement.',
        },
        {
          id: 'IV.C',
          title: 'Governing Board',
          description: 'The governing board acts in the best interests of the institution in setting policies and ensuring effective governance.',
        },
      ],
      reviewSections: ['program_info', 'improvement_actions', 'planning_agenda', 'external_factors'],
      keyQuestions: [
        'Are program decisions aligned with institutional governance?',
        'Does the program participate in collaborative planning?',
        'Are program goals aligned with institutional goals?',
        'How does leadership support program improvement?',
      ],
    },
  ],
  complianceChecklist: {
    standard_I: {
      title: 'Mission & Institutional Effectiveness',
      items: [
        'Clear mission statement aligned with program description',
        'Measurable student learning outcomes defined',
        'Assessment methodology documented',
        'Evidence of closing the loop (using assessment data for improvement)',
        'Program contributes to institutional goals',
        'Data-informed planning documented',
      ],
    },
    standard_II: {
      title: 'Student Learning & Support',
      items: [
        'Student learning outcomes are specific and measurable',
        'Assessment plan is comprehensive and ongoing',
        'Student support services identified and evaluated',
        'Evidence of student success in program completion',
        'Equity data disaggregated by demographic groups',
        'Gap analysis and improvement plans documented',
      ],
    },
    standard_III: {
      title: 'Resources',
      items: [
        'Adequate staffing levels documented',
        'Faculty qualifications meet program needs',
        'Budget allocated to support program goals',
        'Facilities meet program requirements',
        'Technology resources are appropriate and current',
        'Professional development opportunities available',
        'Resource allocation aligned with program priorities',
      ],
    },
    standard_IV: {
      title: 'Leadership & Governance',
      items: [
        'Program participates in institutional governance',
        'Leadership vision supports program mission',
        'Collaborative planning processes documented',
        'Institutional policies support program operations',
        'Program aligns with college strategic plan',
        'Decision-making authority clearly defined',
        'Communication mechanisms with leadership established',
      ],
    },
  },
  commonIssues: [
    {
      issue: 'Insufficient SLO Assessment',
      standards: ['I.B', 'II.A'],
      feedback: 'Programs must demonstrate systematic assessment of student learning outcomes with documented evidence of student mastery.',
    },
    {
      issue: 'Weak Connection to Institutional Mission',
      standards: ['I.A', 'I.C'],
      feedback: 'Clarify how the program contributes to the college mission and institutional strategic priorities.',
    },
    {
      issue: 'Inadequate Resource Allocation',
      standards: ['III.A', 'III.D'],
      feedback: 'Document need for staffing, facilities, or technology through data. Submit RARs (Resource Allocation Requests) to justify additional resources.',
    },
    {
      issue: 'Limited Closing the Loop Evidence',
      standards: ['I.B', 'II.A'],
      feedback: 'Show how assessment results led to programmatic changes and improvements in student outcomes.',
    },
    {
      issue: 'Equity Gaps Not Addressed',
      standards: ['II.C', 'I.C'],
      feedback: 'Disaggregate data by student demographics. Identify and address disparities in student achievement and support.',
    },
    {
      issue: 'Outdated or Unclear Objectives',
      standards: ['I.A', 'I.C'],
      feedback: 'Review program goals and objectives. Ensure they are current, measurable, and aligned with institutional strategic plan.',
    },
  ],
};

/**
 * Get ACCJC Standards object
 */
export function getAllStandards(): typeof accjcData.standards {
  return accjcData.standards;
}

/**
 * Get a specific standard by ID
 */
export function getStandardById(standardId: string): (typeof accjcData.standards)[0] | undefined {
  return accjcData.standards.find(s => s.id === standardId);
}

/**
 * Map a review section to applicable ACCJC standards
 * @param sectionId - The section ID to map
 * @returns Array of applicable standard IDs (e.g., ['I.B', 'II.A'])
 */
export function getMappedStandards(sectionId: string): string[] {
  const standards: string[] = [];

  accjcData.standards.forEach(standard => {
    // Add main standard if section is in reviewSections
    if (standard.reviewSections.includes(sectionId)) {
      standards.push(standard.id);
    }
  });

  return standards;
}

/**
 * Get compliance checklist items for a standard
 * @param standardId - The standard ID (e.g., 'I', 'II', 'III', 'IV')
 * @returns Array of compliance checklist items
 */
export function getComplianceChecklist(standardId: string): string[] {
  const key = `standard_${standardId}` as keyof typeof accjcData.complianceChecklist;
  const checklist = accjcData.complianceChecklist[key];
  return checklist ? checklist.items : [];
}

/**
 * Get compliance checklist title for a standard
 */
export function getComplianceChecklistTitle(standardId: string): string {
  const key = `standard_${standardId}` as keyof typeof accjcData.complianceChecklist;
  const checklist = accjcData.complianceChecklist[key];
  return checklist ? checklist.title : '';
}

/**
 * Get common issues and feedback
 */
export function getCommonIssues() {
  return accjcData.commonIssues;
}

/**
 * Get a specific common issue by name
 */
export function getCommonIssueByName(issueName: string) {
  return accjcData.commonIssues.find(i => i.issue === issueName);
}

/**
 * Get key questions for a standard
 */
export function getKeyQuestions(standardId: string): string[] {
  const standard = getStandardById(standardId);
  return standard ? standard.keyQuestions : [];
}

/**
 * Build ACCJC context for Gemini prompts
 * @param sectionId - The section being written
 * @returns Formatted string with ACCJC context
 */
export function buildAccjcContext(sectionId: string): string {
  const standards = getMappedStandards(sectionId);

  if (standards.length === 0) {
    return '';
  }

  const standardDescriptions = standards
    .map(stdId => {
      const standard = getStandardById(stdId);
      return standard ? `${standard.id}: ${standard.title}` : '';
    })
    .filter(Boolean)
    .join('\n');

  const checklistItems = standards
    .flatMap(stdId => {
      const items = getComplianceChecklist(stdId);
      return items.map(item => `- ${item}`);
    })
    .join('\n');

  return `
## ACCJC Accreditation Standards Context

This section addresses the following ACCJC Standards:
${standardDescriptions}

### Compliance Considerations
${checklistItems}

Please ensure your response demonstrates alignment with these standards and addresses the compliance considerations above.
`;
}

/**
 * Get ACCJC data for initialization (metadata)
 */
export function getAccjcMetadata() {
  return {
    version: accjcData.version,
    totalStandards: accjcData.standards.length,
    standardsList: accjcData.standards.map(s => ({ id: s.id, title: s.title })),
  };
}
