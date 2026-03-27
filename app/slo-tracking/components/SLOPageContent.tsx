'use client';

import { useState } from 'react';
import SLOTrackingDashboard from './SLOTrackingDashboard';
import SLODataDashboard from './SLODataDashboard';

type View = 'tracking' | 'data';

export default function SLOPageContent() {
  const [view, setView] = useState<View>('data');

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SLO Assessment</h1>
          <p className="text-sm text-gray-500 mt-1">Assessment data, proficiency analysis, and tracking</p>
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setView('data')}
            className={`px-4 py-2 text-sm font-medium ${
              view === 'data' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Assessment Data
          </button>
          <button
            onClick={() => setView('tracking')}
            className={`px-4 py-2 text-sm font-medium ${
              view === 'tracking' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Submission Tracking
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'data' ? (
        <SLODataDashboard />
      ) : (
        <SLOTrackingDashboard />
      )}
    </div>
  );
}
