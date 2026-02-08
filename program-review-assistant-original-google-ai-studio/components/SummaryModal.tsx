import React from 'react';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryContent: string;
  isLoading: boolean;
  programName: string;
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  isOpen,
  onClose,
  summaryContent,
  isLoading,
  programName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
      >
        <header className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 id="summary-title" className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <BookOpenIcon className="w-6 h-6 text-blue-600" />
            Executive Summary: {programName}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">&times;</button>
        </header>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <p className="text-slate-600 whitespace-pre-wrap">{summaryContent}</p>
          )}
        </div>

        <footer className="p-4 border-t border-slate-200 bg-slate-50 text-right">
           <a 
            href="#root" 
            onClick={(e) => { e.preventDefault(); onClose(); }} 
            className="text-blue-600 font-semibold hover:underline"
          >
            &larr; View Full Review
          </a>
        </footer>
      </div>
    </div>
  );
};
