'use client';

import { useState } from 'react';

interface Props {
  courseSubject: string;
  courseNumber: string;
  programName: string;
  academicYear: string;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddSLOEngagementModal({
  courseSubject, courseNumber, programName, academicYear, onClose, onAdded,
}: Props) {
  const [engagementType, setEngagementType] = useState('meeting');
  const [engagementDate, setEngagementDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/slo-tracking/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseSubject,
          courseNumber,
          programName,
          academicYear,
          engagementType,
          engagementDate,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to save');

      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Log Activity — {courseSubject} {courseNumber}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
            <select
              value={engagementType}
              onChange={(e) => setEngagementType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="meeting">👥 Meeting</option>
              <option value="email">✉️ Email</option>
              <option value="reminder">🔔 Reminder</option>
              <option value="training">📚 Training</option>
              <option value="data_review">📊 Data Review</option>
              <option value="assessment_submitted">✅ Assessment Submitted</option>
              <option value="other">📝 Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={engagementDate}
              onChange={(e) => setEngagementDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Add notes about this interaction..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
