'use client';

import { useState, useEffect } from 'react';
import AddEngagementModal from './AddEngagementModal';

interface Engagement {
  id: string;
  engagement_type: string;
  engagement_date: string;
  notes: string;
}

interface EngagementPanelProps {
  programName: string;
  academicYear: string;
  programType: string;
  isOpen: boolean;
  onClose: () => void;
}

const engagementTypeLabels: Record<string, string> = {
  meeting: '👥 Meeting',
  email: '✉️ Email',
  data_collection: '📊 Data Collection',
  phone_call: '☎️ Phone Call',
  submitted: '✅ Review Submitted',
  presented: '🎤 Review Presented',
  other: '📝 Other',
};

export default function EngagementPanel({
  programName,
  academicYear,
  programType,
  isOpen,
  onClose,
}: EngagementPanelProps) {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchEngagements();
    }
  }, [isOpen, programName, academicYear]);

  const fetchEngagements = async () => {
    try {
      const response = await fetch(
        `/api/tracking/engagement?program=${encodeURIComponent(programName)}&year=${encodeURIComponent(academicYear)}`
      );
      if (!response.ok) throw new Error('Failed to fetch engagements');
      const data = await response.json();
      setEngagements(data.engagement || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load engagements');
    }
  };

  const handleAddEngagement = async (data: {
    engagementType: string;
    engagementDate: string;
    notes: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tracking/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programName,
          programType,
          academicYear,
          ...data,
        }),
      });

      if (!response.ok) throw new Error('Failed to add engagement');
      await fetchEngagements();
      setIsModalOpen(false);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEngagement = async (id: string) => {
    try {
      const response = await fetch(`/api/tracking/engagement/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete engagement');
      await fetchEngagements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete engagement');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{programName}</h2>
            <p className="text-sm text-gray-600">{academicYear}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Log Activity
          </button>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Activity Log ({engagements.length})
            </h3>

            {engagements.length === 0 ? (
              <p className="text-sm text-gray-500">No activities recorded yet</p>
            ) : (
              <div className="space-y-2">
                {engagements.map((eng) => (
                  <div
                    key={eng.id}
                    className="rounded-md border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {engagementTypeLabels[eng.engagement_type] || eng.engagement_type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(eng.engagement_date).toLocaleDateString()}
                        </p>
                        {eng.notes && (
                          <p className="mt-1 text-xs text-gray-600">{eng.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEngagement(eng.id)}
                        className="ml-2 text-gray-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddEngagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddEngagement}
        isLoading={isLoading}
      />
    </>
  );
}
