'use client';

/**
 * AccjcBadge Component
 * Displays which ACCJC standards a review section addresses
 * ACCJC Integration: Shows compliance alignment at a glance
 */

import { getStandardById } from '@/lib/accjc-standards';
import { useState } from 'react';

interface AccjcBadgeProps {
  standards: string[]; // e.g., ['I', 'II.A']
}

export const AccjcBadge: React.FC<AccjcBadgeProps> = ({ standards }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (standards.length === 0) {
    return null;
  }

  // Map standards to their full information
  const standardDetails = standards
    .map(stdId => {
      // Check if it's a main standard (e.g., 'I') or substandard (e.g., 'I.A')
      const mainId = stdId.split('.')[0];
      const mainStandard = getStandardById(mainId);
      return { id: stdId, standard: mainStandard };
    })
    .filter(s => s.standard);

  return (
    <div className="relative">
      <div
        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 border border-purple-300 rounded-full text-xs font-semibold text-purple-700 cursor-help hover:bg-purple-200 transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="text-lg">🎓</span>
        ACCJC Standards: {standards.join(', ')}
      </div>

      {showTooltip && (
        <div className="absolute left-0 mt-2 bg-slate-800 text-white text-xs p-3 rounded-md shadow-lg z-10 w-64 break-words">
          <p className="font-semibold mb-2">Applicable ACCJC Standards:</p>
          {standardDetails.map(detail => (
            <div key={detail.id} className="mb-2 pb-2 border-b border-slate-600 last:border-b-0">
              <p className="font-bold text-purple-300">{detail.id}: {detail.standard?.title}</p>
              <p className="text-slate-300 text-xs">{detail.standard?.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
