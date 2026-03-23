'use client';

import { useState } from 'react';
import { getCurrentAcademicYear, getAllYears } from '@/lib/tracking-schedule';
import CurrentSeasonTab from './CurrentSeasonTab';
import FullScheduleTab from './FullScheduleTab';

type TabType = 'current' | 'schedule';
type FilterType = 'all' | 'instructional' | 'non_instructional';

export default function TrackingDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [filterType, setFilterType] = useState<FilterType>('all');
  const years = getAllYears();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Program Review Tracking</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 focus:border-blue-500 focus:ring-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'current'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Current Season
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Full Schedule
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Programs
            </button>
            <button
              onClick={() => setFilterType('instructional')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filterType === 'instructional'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Instructional
            </button>
            <button
              onClick={() => setFilterType('non_instructional')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filterType === 'non_instructional'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Non-Instructional
            </button>
          </div>

          {/* Current Season Content */}
          <CurrentSeasonTab year={selectedYear} filterType={filterType} />
        </div>
      )}

      {activeTab === 'schedule' && (
        <FullScheduleTab currentYear={selectedYear} />
      )}
    </div>
  );
}
