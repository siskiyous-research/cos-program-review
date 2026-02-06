'use client';

import { useState } from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { AccjcBadge } from './AccjcBadge';
import { getMappedStandards } from '@/lib/accjc-standards';

interface ReviewSectionProps {
  id: string;
  title: string;
  description: string;
  content: string;
  onContentChange: (content: string) => void;
  onAiAssist: () => void;
  isGenerating: boolean;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  id,
  title,
  description,
  content,
  onContentChange,
  onAiAssist,
  isGenerating,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  // ACCJC Integration: Get mapped standards for this section
  const mappedStandards = getMappedStandards(id);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
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
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Enter your analysis for this section..."
          className="w-full h-48 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 resize-y"
          disabled={isGenerating}
        />
        {isGenerating && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-md">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
        <button
          onClick={handleSave}
          disabled={isGenerating}
          className={`px-4 py-2 font-semibold rounded-md transition-colors duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed ${
            isSaved ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          {isSaved ? 'Saved ✓' : 'Save'}
        </button>
        <button
          onClick={onAiAssist}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          <SparklesIcon className="w-5 h-5" />
          {isGenerating ? 'Generating...' : 'AI Assist'}
        </button>
      </div>
    </div>
  );
};
