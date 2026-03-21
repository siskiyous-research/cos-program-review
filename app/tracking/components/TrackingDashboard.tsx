'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCurrentAcademicYear, getAllYears, INSTRUCTIONAL_SCHEDULE, NON_INSTRUCTIONAL_SCHEDULE } from '@/lib/tracking-schedule';
import EngagementPanel from './EngagementPanel';

type FilterType = 'all' | 'instructional' | 'non_instructional' | 'needs_followup' | 'engaged' | 'complete';

interface ProgramStatus {
  draftSubmitted: boolean;
  finalSubmitted: boolean;
  engagementCount: number;
}

export default function TrackingDashboard() {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [statuses, setStatuses] = useState<Record<string, ProgramStatus>>({});
  const [engagementPanel, setEngagementPanel] = useState<{ program: string; type: string } | null>(null);
  const currentYear = getCurrentAcademicYear();
  const years = getAllYears();
  const allPrograms = [...INSTRUCTIONAL_SCHEDULE, ...NON_INSTRUCTIONAL_SCHEDULE];

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch(`/api/tracking/schedule?year=${currentYear}`);
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, ProgramStatus> = {};
      for (const p of data.programs || []) {
        map[p.name] = {
          draftSubmitted: p.draftSubmitted,
          finalSubmitted: p.finalSubmitted,
          engagementCount: p.engagementCount,
        };
      }
      setStatuses(map);
    } catch {
      // silent
    }
  }, [currentYear]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const getStatus = (name: string): 'green' | 'yellow' | 'red' => {
    const s = statuses[name];
    if (!s) return 'red';
    if (s.finalSubmitted) return 'green';
    if (s.draftSubmitted || s.engagementCount > 0) return 'yellow';
    return 'red';
  };

  const filtered = allPrograms.filter((p) => {
    if (filterType === 'instructional') return p.type === 'instructional';
    if (filterType === 'non_instructional') return p.type === 'non_instructional';
    if (filterType === 'needs_followup') return getStatus(p.name) === 'red';
    if (filterType === 'engaged') return getStatus(p.name) === 'yellow';
    if (filterType === 'complete') return getStatus(p.name) === 'green';
    return true;
  });

  const stats = {
    red: allPrograms.filter((p) => getStatus(p.name) === 'red').length,
    yellow: allPrograms.filter((p) => getStatus(p.name) === 'yellow').length,
    green: allPrograms.filter((p) => getStatus(p.name) === 'green').length,
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: `All (${allPrograms.length})` },
    { key: 'needs_followup', label: `Needs Follow-up (${stats.red})` },
    { key: 'engaged', label: `Engaged (${stats.yellow})` },
    { key: 'complete', label: `Complete (${stats.green})` },
    { key: 'instructional', label: 'Instructional' },
    { key: 'non_instructional', label: 'Non-Instructional' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Program Review Tracking</h1>
        <p className="mt-2 text-sm text-gray-500">
          <span className="inline-block rounded bg-amber-100 text-amber-800 px-2 py-0.5 font-semibold mr-2">PR</span>
          = Comprehensive Program Review
          <span className="inline-block rounded bg-gray-200 text-gray-700 px-2 py-0.5 font-semibold mx-2 ml-4">AU</span>
          = Annual Update
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filterType === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 z-10 bg-gray-50 border-b border-r border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Program
              </th>
              <th className="border-b border-r border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-500 w-28">
                Status
              </th>
              {years.map((year) => (
                <th
                  key={year}
                  className={`border-b border-r border-gray-200 px-3 py-3 text-center text-xs font-semibold whitespace-nowrap ${
                    year === currentYear ? 'bg-green-50 text-green-800' : 'text-gray-500'
                  }`}
                >
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((program) => {
              const status = getStatus(program.name);
              const s = statuses[program.name];

              return (
                <tr key={program.name} className="hover:bg-gray-50/50">
                  <td className="sticky left-0 z-10 bg-white border-b border-r border-gray-200 px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{program.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {program.type === 'instructional' ? 'Instructional' : 'Non-Instructional'}
                        </p>
                      </div>
                      <button
                        onClick={() => setEngagementPanel({ program: program.name, type: program.type })}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors flex-shrink-0"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Log
                        {s && s.engagementCount > 0 && (
                          <span className="ml-0.5 rounded-full bg-blue-600 text-white px-1.5 py-0 text-[10px]">
                            {s.engagementCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="border-b border-r border-gray-200 px-2 py-2.5 text-center">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      status === 'red' ? 'bg-red-100 text-red-700' :
                      status === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {status === 'red' ? 'Follow-up' : status === 'yellow' ? 'Engaged' : 'Complete'}
                    </span>
                  </td>
                  {years.map((year) => {
                    const reviewType = program.years[year];
                    const isCurrentYear = year === currentYear;

                    return (
                      <td
                        key={`${program.name}-${year}`}
                        className={`border-b border-r border-gray-200 px-2 py-2.5 text-center ${
                          isCurrentYear ? 'bg-green-50/50' : ''
                        }`}
                      >
                        {reviewType ? (
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                            reviewType === 'PR'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {reviewType}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-50 border border-green-200"></span>
          Current year ({currentYear})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block rounded bg-amber-100 text-amber-800 px-1.5 py-0 text-[10px] font-semibold">PR</span>
          Comprehensive Review
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block rounded bg-gray-100 text-gray-600 px-1.5 py-0 text-[10px] font-semibold">AU</span>
          Annual Update
        </span>
      </div>

      {/* Engagement Panel */}
      {engagementPanel && (
        <EngagementPanel
          programName={engagementPanel.program}
          academicYear={currentYear}
          programType={engagementPanel.type}
          isOpen={true}
          onClose={() => {
            setEngagementPanel(null);
            fetchStatuses();
          }}
        />
      )}
    </div>
  );
}
