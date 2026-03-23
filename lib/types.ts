/**
 * Type definitions for the Program Review Assistant
 */

export interface ProgramData {
  programName: string;
  summary: {
    strengths: string[];
    weaknesses: string[];
  };
  enrollment: { year: number; count: number }[];
  completionRate: number;
  jobPlacementRate: number;
  demographics: {
    [key: string]: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  citations?: Citation[];
}

export interface ReviewTemplateItem {
  id: string;
  title: string;
  description: string;
}

export interface HistoricalReview {
  year: number;
  type: 'Annual' | 'Comprehensive';
  title: string;
  content: string;
  url?: string;
}

export interface HistoricalData {
  [programName: string]: HistoricalReview[];
}

/**
 * RAG (Retrieval-Augmented Generation) types
 */

export interface DataChunk {
  id: string;
  source: 'policy' | 'review' | 'accreditation' | 'meeting';
  sourceId: string;
  title: string;
  text: string;
  metadata: {
    chapter?: string;
    policyNumber?: string;
    policyType?: 'BP' | 'AP';
    program?: string;
    programCategory?: string;
    year?: number;
    reviewType?: 'Annual' | 'Comprehensive';
    sectionId?: string;
    standardId?: string;
  };
  tags: string[];
  tokenCount: number;
}

export interface SearchIndexEntry {
  chunkId: string;
  source: DataChunk['source'];
  title: string;
  tags: string[];
  metadata: DataChunk['metadata'];
  filePath: string;
}

export interface SearchIndex {
  version: string;
  generatedAt: string;
  totalChunks: number;
  entries: SearchIndexEntry[];
}

export interface RAGContext {
  chunks: DataChunk[];
  totalTokens: number;
  sources: string[];
}

export interface Citation {
  id: number;
  title: string;
  source: DataChunk['source'];
  url?: string;
}

export interface RAGContextWithCitations {
  promptText: string;
  citations: Citation[];
}

/**
 * ACCJC-related types for compliance tracking
 */

export interface AccjcStandard {
  id: string;
  title: string;
  description: string;
  substandards: AccjcSubstandard[];
  reviewSections: string[];
  keyQuestions: string[];
}

export interface AccjcSubstandard {
  id: string;
  title: string;
  description: string;
}

export interface ComplianceChecklistItem {
  id: string;
  text: string;
  standard: string;
  completed: boolean;
}

export interface AccjcIntegration {
  standards: string[]; // e.g., ['I.B', 'II.A']
  checklist: ComplianceChecklistItem[];
  feedback: string;
}

/**
 * Knowledge Base file upload
 */
export interface KBFile {
  id: string;
  name: string;
  type: string;
  size: number;
  textContent: string;
  processingTime?: number;
}

/**
 * Zogotech Institutional Data Types
 */

export interface EnrollmentRecord {
  term: string;
  termOrder: number;
  academicYear: string;
  count: number;
}

export interface SuccessRecord {
  term: string;
  count: number;
  successRate: number;
  completionRate: number;
}

export interface EthnicitySuccessRecord {
  academicYear: string;
  ethnicity: string;
  count: number;
  successRate: number;
}

export interface DemographicRecord {
  ethnicity: string;
  count: number;
  pct: number;
}

export interface GenderRecord {
  academicYear: string;
  gender: string;
  count: number;
}

export interface AgeGroupRecord {
  academicYear: string;
  ageGroup: string;
  count: number;
}

export interface ModalityRecord {
  academicYear: string;
  modeGroup: string;
  count: number;
  successRate: number;
}

export interface RetentionRecord {
  cohortTerm: string;
  termIndex: number;
  count: number;
}

export interface HighSchoolRecord {
  school: string;
  count: number;
  pct: number;
}

export interface FTESRecord {
  academicYear: string;
  ftes: number;
}

export interface CourseRecord {
  courseNumber: string;
  title: string;
  count: number;
  withdrawalRate: number;
}

export interface LocationRecord {
  location: string;
  count: number;
  pct: number;
}

export interface AggregatedProgramData {
  subject: string;
  fetchedAt: string;
  enrollment: EnrollmentRecord[];
  successFall: SuccessRecord[];
  successSpring: SuccessRecord[];
  successSummerWinter: SuccessRecord[];
  successByEthnicity: EthnicitySuccessRecord[];
  demographics: DemographicRecord[];
  gender: GenderRecord[];
  ageGroups: AgeGroupRecord[];
  modality: ModalityRecord[];
  retention: RetentionRecord[];
  highSchools: HighSchoolRecord[];
  ftes: FTESRecord[];
  degreeApplicableCourses: CourseRecord[];
  notDegreeApplicableCourses: CourseRecord[];
  location: LocationRecord[];
}
