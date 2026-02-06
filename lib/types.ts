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
