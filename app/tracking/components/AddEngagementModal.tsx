'use client';

import { useState } from 'react';

type EngagementType = 'meeting' | 'email' | 'data_collection' | 'phone_call' | 'other';

interface AddEngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    engagementType: EngagementType;
    engagementDate: string;
    notes: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export default function AddEngagementModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddEngagementModalProps) {
  const [engagementType, setEngagementType] = useState<EngagementType>('meeting');
  const [engagementDate, setEngagementDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await onSubmit({ engagementType, engagementDate, notes });
      setEngagementType('meeting');
      setEngagementDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add engagement');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Log Activity</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Activity Type
            </label>
            <select
              value={engagementType}
              onChange={(e) => setEngagementType(e.target.value as EngagementType)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="meeting">Meeting</option>
              <option value="email">Email</option>
              <option value="data_collection">Data Collection</option>
              <option value="phone_call">Phone Call</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={engagementDate}
              onChange={(e) => setEngagementDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details about this engagement..."
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
