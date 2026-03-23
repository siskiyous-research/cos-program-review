'use client';

import { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { AccjcBadge } from './AccjcBadge';
import { RichTextEditor } from './RichTextEditor';
import { getMappedStandards } from '@/lib/accjc-standards';
import { Citation } from '@/lib/types';

interface ReviewSectionProps {
  id: string;
  title: string;
  description: string;
  content: string;
  onContentChange: (content: string) => void;
  onAiAssist: () => void;
  isGenerating: boolean;
  citations?: Citation[];
  guidance?: string;
  onGetGuidance?: () => void;
  isGeneratingGuidance?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onSave?: () => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  id,
  title,
  description,
  content,
  onContentChange,
  onAiAssist,
  isGenerating,
  citations,
  guidance,
  onGetGuidance,
  isGeneratingGuidance,
  saveStatus,
  onSave,
}) => {
  const [isCitationsOpen, setIsCitationsOpen] = useState(false);
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  // ACCJC Integration: Get mapped standards for this section
  const mappedStandards = getMappedStandards(id);

  const hasContent = content.trim().length > 0;
  const hasCitations = citations && citations.length > 0;
  const hasGuidance = guidance && guidance.trim().length > 0;

  const sourceLabel: Record<string, string> = {
    policy: 'policy',
    review: 'review',
    accreditation: 'accreditation',
    meeting: 'minutes',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 transition-all duration-300 hover:shadow-lg">
      <div className="mb-2 flex flex-col sm:flex-row justify-between items-start gap-2">
        <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
        {/* ACCJC Compliance Badge */}
        {mappedStandards.length > 0 && (
          <AccjcBadge standards={mappedStandards} />
        )}
      </div>
      <p className="text-slate-500 mb-4">{description}</p>

      <div className="relative">
        <RichTextEditor
          variant="full"
          content={content}
          onChange={onContentChange}
        />
        {isGenerating && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-md z-10">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Citations Panel */}
      {hasCitations && (
        <div className="mt-3 border border-slate-200 rounded-md overflow-hidden">
          <button
            onClick={() => setIsCitationsOpen(!isCitationsOpen)}
            className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
          >
            <span>Sources ({citations.length})</span>
            <svg
              className={`w-4 h-4 transition-transform ${isCitationsOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isCitationsOpen && (
            <div className="px-4 py-3 space-y-1 bg-white">
              {citations.map((cite) => (
                <div key={cite.id} className="text-sm text-slate-600">
                  <span className="font-mono text-blue-600 font-semibold">[{cite.id}]</span>{' '}
                  {cite.url ? (
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {cite.title}
                    </a>
                  ) : (
                    <span>{cite.title}</span>
                  )}
                  <span className="text-slate-400 ml-1">({sourceLabel[cite.source] || cite.source})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACCJC Guidance Panel */}
      {hasGuidance && (
        <div className="mt-3 border border-amber-200 rounded-md overflow-hidden">
          <button
            onClick={() => setIsGuidanceOpen(!isGuidanceOpen)}
            className="w-full flex items-center justify-between px-4 py-2 bg-amber-50 hover:bg-amber-100 transition-colors text-sm font-medium text-amber-800"
          >
            <span>ACCJC Guidance</span>
            <svg
              className={`w-4 h-4 transition-transform ${isGuidanceOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isGuidanceOpen && (
            <div className="px-4 py-3 bg-amber-50/50 text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
              {guidance}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row justify-end items-center gap-2">
        {/* Save status */}
        {saveStatus === 'saving' && (
          <span className="text-sm text-blue-600 flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block"></span>
            Saving...
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-sm text-green-600">Saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-red-600">Save failed</span>
        )}

        {/* Per-section Save button */}
        {onSave && (
          <button
            onClick={onSave}
            disabled={isGenerating || saveStatus === 'saving'}
            className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
          >
            Save
          </button>
        )}

        {/* ACCJC Guidance Button - visible once content exists */}
        {hasContent && onGetGuidance && (
          <button
            onClick={onGetGuidance}
            disabled={isGeneratingGuidance || isGenerating}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold rounded-md hover:bg-amber-600 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            {isGeneratingGuidance ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Getting Guidance...
              </>
            ) : (
              'Get ACCJC Guidance'
            )}
          </button>
        )}

        <button
          onClick={onAiAssist}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <SparklesIcon className="w-5 h-5" />
          {isGenerating
            ? 'Generating...'
            : hasContent
              ? 'AI Assist'
              : 'Help Me Get Started'}
        </button>
      </div>
    </div>
  );
};
