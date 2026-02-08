export interface ProgramData {
  programName: string;
  summary: {
    strengths: string[];
    weaknesses:string[];
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
  // content could be the full text or a summary
  content: string;
  url?: string; // URL to view the original file
}

export interface HistoricalData {
  [programName: string]: HistoricalReview[];
}