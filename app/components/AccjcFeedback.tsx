'use client';

/**
 * AccjcFeedback Component
 * Shows compliance guidance and common issues for a section
 * ACCJC Integration: Provides constructive feedback to faculty
 */

import { getCommonIssues } from '@/lib/accjc-standards';
import { useState } from 'react';

interface AccjcFeedbackProps {
  sectionId: string; // The review section ID
  showCommonIssues?: boolean;
}

export const AccjcFeedback: React.FC<AccjcFeedbackProps> = ({ sectionId, showCommonIssues = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const commonIssues = getCommonIssues();

  // Filter issues relevant to program reviews generally
  const relevantIssues = commonIssues.slice(0, 3);

  if (!showCommonIssues || relevantIssues.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex items-center justify-between hover:bg-amber-100 p-2 rounded transition-colors"
      >
        <h4 className="font-semibold text-amber-900 flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          Common ACCJC Feedback & Best Practices
        </h4>
        <span className={`text-xl text-amber-700 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3 pl-2">
          {relevantIssues.map((issue, index) => (
            <div key={index} className="border-l-2 border-amber-300 pl-3">
              <p className="font-semibold text-amber-900 text-sm">{issue.issue}</p>
              <p className="text-amber-800 text-xs mt-1">{issue.feedback}</p>
              {issue.standards.length > 0 && (
                <p className="text-amber-700 text-xs mt-1">
                  <strong>Relevant Standards:</strong> {issue.standards.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 text-xs text-amber-700 font-semibold">
        💡 Tip: Address these common issues to strengthen your accreditation self-evaluation.
      </div>
    </div>
  );
};
