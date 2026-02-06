'use client';

/**
 * ComplianceChecklist Component
 * Displays ACCJC compliance checklist items for a standard
 * ACCJC Integration: Helps faculty track compliance requirements
 */

import { getComplianceChecklistTitle, getComplianceChecklist } from '@/lib/accjc-standards';
import { useState } from 'react';

interface ComplianceChecklistProps {
  standardId: string; // e.g., 'I', 'II', 'III', 'IV'
  onItemCheck?: (itemIndex: number, checked: boolean) => void;
}

export const ComplianceChecklist: React.FC<ComplianceChecklistProps> = ({ standardId, onItemCheck }) => {
  const title = getComplianceChecklistTitle(standardId);
  const items = getComplianceChecklist(standardId);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const handleCheck = (index: number) => {
    const newChecked = !checkedItems[index];
    setCheckedItems(prev => ({ ...prev, [index]: newChecked }));
    onItemCheck?.(index, newChecked);
  };

  if (items.length === 0) {
    return null;
  }

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const completionPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-green-900 flex items-center gap-2">
          <span className="text-lg">✓</span>
          ACCJC Standard {standardId}: {title}
        </h4>
        <div className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
          {completedCount}/{items.length} ({completionPercent}%)
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <label key={index} className="flex items-start gap-3 cursor-pointer hover:bg-green-100 p-2 rounded transition-colors">
            <input
              type="checkbox"
              checked={checkedItems[index] || false}
              onChange={() => handleCheck(index)}
              className="w-4 h-4 mt-1 rounded border-green-300 text-green-600 focus:ring-green-500"
            />
            <span className={`text-xs ${checkedItems[index] ? 'text-green-700 line-through' : 'text-green-800'}`}>
              {item}
            </span>
          </label>
        ))}
      </div>

      {completionPercent === 100 && (
        <div className="mt-3 p-2 bg-green-200 border border-green-400 rounded text-xs text-green-900 font-semibold text-center">
          ✓ All compliance items addressed!
        </div>
      )}
    </div>
  );
};
