'use client';

import { ReviewSection } from './ReviewSection';
import { ReviewTemplateItem, Citation } from '@/lib/types';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface ProgramReviewFormProps {
  programName: string;
  reviewSections: Record<string, string>;
  template: ReviewTemplateItem[];
  onSectionTextChange: (sectionId: string, text: string) => void;
  onAiAssist: (sectionId: string) => void;
  isGeneratingSection: string | null;
  onExport: () => void;
  onPreview: () => void;
  onSubmit: () => void;
  onSaveAll: () => void;
  sectionCitations: Record<string, Citation[]>;
  sectionGuidance: Record<string, string>;
  onGetGuidance: (sectionId: string) => void;
  isGeneratingGuidance: string | null;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onSaveSection: (sectionId: string) => void;
  onSaveToSharePoint: () => void;
  sharePointStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onViewData?: (sectionId: string) => void;
  hasData?: boolean;
}

export const ProgramReviewForm: React.FC<ProgramReviewFormProps> = ({
  programName,
  reviewSections,
  template,
  onSectionTextChange,
  onAiAssist,
  isGeneratingSection,
  onExport,
  onPreview,
  onSubmit,
  onSaveAll,
  sectionCitations,
  sectionGuidance,
  onGetGuidance,
  isGeneratingGuidance,
  saveStatus,
  onSaveSection,
  onSaveToSharePoint,
  sharePointStatus,
  onViewData,
  hasData,
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
          AI Assistant to help you draft content based on the program&apos;s data.
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
          saveStatus={saveStatus}
          onSave={() => onSaveSection(section.id)}
          onViewData={onViewData ? () => onViewData(section.id) : undefined}
          hasData={hasData}
        />
      ))}

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          Finalize Your Review
        </h3>
        <p className="text-slate-500 mb-4">
          Save all sections, preview the full document, or submit for review.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onSaveAll}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            {saveStatus === 'saving' ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save All Sections
              </>
            )}
          </button>
          <button
            onClick={onPreview}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <DocumentTextIcon className="w-5 h-5" />
            Preview Review
          </button>
          <button
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-500 text-white font-semibold rounded-md hover:bg-slate-600 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export HTML
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Submit Review
          </button>
          <button
            onClick={onSaveToSharePoint}
            disabled={sharePointStatus === 'saving'}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 font-semibold rounded-md transition-colors duration-200 shadow-sm hover:shadow-md ${
              sharePointStatus === 'saved'
                ? 'bg-green-600 text-white'
                : sharePointStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-slate-400'
            }`}
          >
            {sharePointStatus === 'saving' ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : sharePointStatus === 'saved' ? (
              'Saved to SharePoint'
            ) : sharePointStatus === 'error' ? (
              'SharePoint Error'
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Save to SharePoint
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
