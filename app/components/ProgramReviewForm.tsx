'use client';

import { ReviewSection } from './ReviewSection';
import { ReviewTemplateItem, Citation } from '@/lib/types';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface ProgramReviewFormProps {
  programName: string;
  reviewSections: Record<string, string>;
  template: ReviewTemplateItem[];
  onSectionTextChange: (sectionId: string, text: string) => void;
  onAiAssist: (sectionId: string) => void;
  isGeneratingSection: string | null;
  onExport: () => void;
  onGenerateSummary: () => void;
  isGeneratingSummary: boolean;
  sectionCitations: Record<string, Citation[]>;
  sectionGuidance: Record<string, string>;
  onGetGuidance: (sectionId: string) => void;
  isGeneratingGuidance: string | null;
}

export const ProgramReviewForm: React.FC<ProgramReviewFormProps> = ({
  programName,
  reviewSections,
  template,
  onSectionTextChange,
  onAiAssist,
  isGeneratingSection,
  onExport,
  onGenerateSummary,
  isGeneratingSummary,
  sectionCitations,
  sectionGuidance,
  onGetGuidance,
  isGeneratingGuidance,
}) => {
  return (
    <div className="space-y-8">
      <div className="p-6 bg-white rounded-lg shadow-md border border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-800">
          Review for:{' '}
          <span className="text-blue-600">{programName} Program</span>
        </h2>
        <p className="mt-2 text-slate-600">
          Complete each section below. You can write your own thoughts or use the
          AI Assistant to help you draft content based on the program's data.
        </p>
      </div>

      {template.map((section) => (
        <ReviewSection
          key={section.id}
          id={section.id}
          title={section.title}
          description={section.description}
          content={reviewSections[section.id] || ''}
          onContentChange={(text) => onSectionTextChange(section.id, text)}
          onAiAssist={() => onAiAssist(section.id)}
          isGenerating={isGeneratingSection === section.id}
          citations={sectionCitations[section.id]}
          guidance={sectionGuidance[section.id]}
          onGetGuidance={() => onGetGuidance(section.id)}
          isGeneratingGuidance={isGeneratingGuidance === section.id}
        />
      ))}

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          Finalize Your Review
        </h3>
        <p className="text-slate-500 mb-4">
          Once you have completed all sections, you can export the full document or
          generate an executive summary.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 disabled:bg-slate-400 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <DocumentTextIcon className="w-5 h-5" />
            Export Full Review
          </button>
          <button
            onClick={onGenerateSummary}
            disabled={isGeneratingSummary}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <BookOpenIcon className="w-5 h-5" />
            {isGeneratingSummary ? 'Generating...' : 'Generate Executive Summary'}
          </button>
        </div>
      </div>
    </div>
  );
};
