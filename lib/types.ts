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
