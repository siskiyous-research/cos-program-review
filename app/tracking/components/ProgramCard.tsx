'use client';

import { useState } from 'react';
import EngagementPanel from './EngagementPanel';

interface ProgramCardProps {
  name: string;
  type: 'instructional' | 'non_instructional';
  reviewType: 'PR' | 'AU';
  status: 'red' | 'yellow' | 'green';
  engagementCount: number;
  lastEngagementDate: string | null;
  draftSubmitted: boolean;
  finalSubmitted: boolean;
  onStatusChange: (draftSubmitted: boolean, finalSubmitted: boolean) => void;
  academicYear: string;
}

const statusColors = {
  red: 'bg-red-50 border-red-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  green: 'bg-green-50 border-green-200',
};

const statusBadges = {
  red: '🔴 Needs Follow-up',
  yellow: '🟡 Engaged',
  green: '🟢 Submitted',
};

const typeLabels = {
  instructional: 'Instructional',
  non_instructional: 'Non-Instructional',
};

export default function ProgramCard({
  name,
  type,
  reviewType,
  status,
  engagementCount,
  lastEngagementDate,
  draftSubmitted,
  finalSubmitted,
  onStatusChange,
  academicYear,
}: ProgramCardProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDraftChecked, setIsDraftChecked] = useState(draftSubmitted);
  const [isFinalChecked, setIsFinalChecked] = useState(finalSubmitted);
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusChange = async (fieldName: 'draft' | 'final', value: boolean) => {
    setIsSaving(true);
    try {
      const newDraft = fieldName === 'draft' ? value : isDraftChecked;
      const newFinal = fieldName === 'final' ? value : isFinalChecked;

      const response = await fetch('/api/tracking/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programName: name,
          programType: type,
          academicYear,
          draftSubmitted: newDraft,
          finalSubmitted: newFinal,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      if (fieldName === 'draft') {
        setIsDraftChecked(value);
      } else {
        setIsFinalChecked(value);
      }
      onStatusChange(newDraft, newFinal);
    } catch (err) {
      console.error('Failed to update status:', err);
      // Reset on error
      if (fieldName === 'draft') {
        setIsDraftChecked(!value);
      } else {
        setIsFinalChecked(!value);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div
        className={`rounded-lg border p-4 transition-all ${statusColors[status]} hover:shadow-md`}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-xs text-gray-600">{typeLabels[type]}</p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded-full bg-gray-200 px-2 py-1 text-xs font-medium">
              {reviewType === 'PR' ? 'Program Review' : 'Annual Update'}
            </span>
          </div>
        </div>

        <div className="mb-3 space-y-2">
          <div className="flex items-center">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isDraftChecked}
                onChange={(e) => handleStatusChange('draft', e.target.checked)}
                disabled={isSaving}
                className="mr-2"
              />
              Draft completed
            </label>
          </div>
          <div className="flex items-center">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isFinalChecked}
                onChange={(e) => handleStatusChange('final', e.target.checked)}
                disabled={isSaving}
                className="mr-2"
              />
              Final submitted
            </label>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            status === 'red' ? 'bg-red-100 text-red-800' :
            status === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {statusBadges[status]}
          </span>
        </div>

        <div className="mb-4 text-xs text-gray-600">
          {engagementCount > 0 ? (
            <>
              <p>{engagementCount} engagement(s)</p>
              {lastEngagementDate && (
                <p>Last: {new Date(lastEngagementDate).toLocaleDateString()}</p>
              )}
            </>
          ) : (
            <p>No engagement recorded</p>
          )}
        </div>

        <button
          onClick={() => setIsPanelOpen(true)}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Log Activity
        </button>
      </div>

      <EngagementPanel
        programName={name}
        academicYear={academicYear}
        programType={type}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </>
  );
}
