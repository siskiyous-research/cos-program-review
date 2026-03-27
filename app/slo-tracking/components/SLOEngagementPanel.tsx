'use client';

import { useState, useEffect, useCallback } from 'react';
import { SLO_ENGAGEMENT_TYPE_LABELS, type SLOEngagementType } from '@/lib/slo-types';
import AddSLOEngagementModal from './AddSLOEngagementModal';

interface EngagementEntry {
  id: string;
  engagement_type: string;
  engagement_date: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  courseSubject: string;
  courseNumber: string;
  programName: string;
  courseTitle: string | null;
  academicYear: string;
  onClose: () => void;
}

export default function SLOEngagementPanel({
  courseSubject, courseNumber, programName, courseTitle, academicYear, onClose,
}: Props) {
  const [entries, setEntries] = useState<EngagementEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/slo-tracking/engagement?subject=${courseSubject}&number=${courseNumber}&year=${academicYear}`
      );
      const data = await res.json();
      if (data.ok) {
        setEntries(data.engagement);
      }
    } catch (e) {
      console.error('Failed to fetch SLO engagement:', e);
    } finally {
      setLoading(false);
    }
  }, [courseSubject, courseNumber, academicYear]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/slo-tracking/engagement/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete engagement:', e);
    }
  };

  const handleAdd = () => {
    setShowModal(false);
    fetchEntries();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-xl border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {courseSubject} {courseNumber}
              </h3>
              {courseTitle && <p className="text-sm text-gray-500">{courseTitle}</p>}
              <p className="text-xs text-gray-400 mt-1">{programName} &middot; {academicYear}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
        </div>

        {/* Add button */}
        <div className="p-4">
          <button
            onClick={() => setShowModal(true)}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Log Activity
          </button>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Activity Log ({entries.length})
          </h4>

          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-400">No activities logged yet.</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const label = SLO_ENGAGEMENT_TYPE_LABELS[entry.engagement_type as SLOEngagementType] || entry.engagement_type;
                return (
                  <div key={entry.id} className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{label}</div>
                      <div className="text-xs text-gray-500">{entry.engagement_date}</div>
                      {entry.notes && (
                        <div className="mt-1 text-xs text-gray-600">{entry.notes}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-gray-300 hover:text-red-500 text-sm ml-2"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <AddSLOEngagementModal
          courseSubject={courseSubject}
          courseNumber={courseNumber}
          programName={programName}
          academicYear={academicYear}
          onClose={() => setShowModal(false)}
          onAdded={handleAdd}
        />
      )}
    </>
  );
}
