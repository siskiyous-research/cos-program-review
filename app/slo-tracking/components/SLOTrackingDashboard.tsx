'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SLOCourseStatus, SLOStatus, SLOProgramSummary } from '@/lib/slo-types';
import { buildProgramSummaries } from '@/lib/slo-schedule';
import SLOEngagementPanel from './SLOEngagementPanel';
import SLOProgramRollup from './SLOProgramRollup';

type FilterType = 'all' | 'not_started' | 'in_progress' | 'assessed' | 'analyzed' | 'complete';
type ViewMode = 'courses' | 'programs';

const STATUS_CONFIG: Record<SLOStatus, { label: string; color: string; bg: string }> = {
  not_started: { label: 'Not Started', color: 'text-red-700', bg: 'bg-red-100' },
  in_progress: { label: 'In Progress', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  assessed: { label: 'Assessed', color: 'text-blue-700', bg: 'bg-blue-100' },
  analyzed: { label: 'Analyzed', color: 'text-green-700', bg: 'bg-green-100' },
  complete: { label: 'Complete', color: 'text-emerald-700', bg: 'bg-emerald-100' },
};

export default function SLOTrackingDashboard() {
  const [courses, setCourses] = useState<SLOCourseStatus[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterType>('all');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('courses');
  const [engagementPanel, setEngagementPanel] = useState<{
    courseSubject: string;
    courseNumber: string;
    programName: string;
    courseTitle: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const year = '2025-2026';

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/slo-tracking/schedule?year=${year}`);
      const data = await res.json();
      if (data.ok) {
        setCourses(data.courses);
      }
    } catch (e) {
      console.error('Failed to fetch SLO courses:', e);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Get unique divisions
  const divisions = [...new Set(courses.map((c) => c.division))].sort();

  // Filter courses
  const filtered = courses.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (divisionFilter !== 'all' && c.division !== divisionFilter) return false;
    return true;
  });

  // Stats
  const stats = {
    total: courses.length,
    not_started: courses.filter((c) => c.status === 'not_started').length,
    in_progress: courses.filter((c) => c.status === 'in_progress').length,
    assessed: courses.filter((c) => c.status === 'assessed').length,
    analyzed: courses.filter((c) => c.status === 'analyzed').length,
    complete: courses.filter((c) => c.status === 'complete').length,
  };

  // Program summaries for rollup view
  const programSummaries: SLOProgramSummary[] = buildProgramSummaries(filtered);

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'not_started', label: 'Not Started', count: stats.not_started },
    { key: 'in_progress', label: 'In Progress', count: stats.in_progress },
    { key: 'assessed', label: 'Assessed', count: stats.assessed },
    { key: 'analyzed', label: 'Analyzed', count: stats.analyzed },
    { key: 'complete', label: 'Complete', count: stats.complete },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SLO Assessment Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track SLO assessment lifecycle: Defined → Assessed → Analyzed → Improvements Made
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {filters.map((f) => (
          <div
            key={f.key}
            className={`rounded-lg border p-3 text-center cursor-pointer transition-colors ${
              filterStatus === f.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setFilterStatus(f.key)}
          >
            <div className="text-2xl font-bold text-gray-900">{f.count}</div>
            <div className="text-xs text-gray-500">{f.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          {/* Status filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterStatus === f.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Division sub-filters */}
          {divisions.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-2">
              <button
                onClick={() => setDivisionFilter('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  divisionFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                All Divisions
              </button>
              {divisions.map((div) => (
                <button
                  key={div}
                  onClick={() => setDivisionFilter(div)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    divisionFilter === div ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  {div}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setViewMode('courses')}
            className={`px-3 py-1.5 text-sm font-medium ${
              viewMode === 'courses' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setViewMode('programs')}
            className={`px-3 py-1.5 text-sm font-medium ${
              viewMode === 'programs' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Program Rollup
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading SLO tracking data...</div>
      ) : courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-500">No courses loaded for SLO tracking.</p>
          <p className="mt-1 text-sm text-gray-400">
            Upload a course list CSV in the <a href="/admin" className="text-blue-600 hover:underline">Admin</a> page.
          </p>
        </div>
      ) : viewMode === 'programs' ? (
        <SLOProgramRollup
          summaries={programSummaries}
          onSelectProgram={(program) => {
            setDivisionFilter('all');
            setFilterStatus('all');
            // Could add a programFilter state but for now just filter by division
          }}
        />
      ) : (
        /* Course table */
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Course</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Program</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Faculty</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Defined</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Assessed</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Analyzed</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Improved</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((course) => {
                const cfg = STATUS_CONFIG[course.status];
                return (
                  <tr key={`${course.courseSubject}-${course.courseNumber}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {course.courseSubject} {course.courseNumber}
                      </div>
                      {course.courseTitle && (
                        <div className="text-xs text-gray-500">{course.courseTitle}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{course.programName}</div>
                      <div className="text-xs text-gray-400">{course.division}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {course.facultyName || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <LifecycleCheck checked={course.sloDefined} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <LifecycleCheck checked={course.sloAssessed} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <LifecycleCheck checked={course.resultsAnalyzed} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <LifecycleCheck checked={course.improvementsMade} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setEngagementPanel({
                          courseSubject: course.courseSubject,
                          courseNumber: course.courseNumber,
                          programName: course.programName,
                          courseTitle: course.courseTitle,
                        })}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      >
                        + Log
                        {course.engagementCount > 0 && (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                            {course.engagementCount}
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No courses match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Engagement Panel */}
      {engagementPanel && (
        <SLOEngagementPanel
          courseSubject={engagementPanel.courseSubject}
          courseNumber={engagementPanel.courseNumber}
          programName={engagementPanel.programName}
          courseTitle={engagementPanel.courseTitle}
          academicYear={year}
          onClose={() => { setEngagementPanel(null); fetchCourses(); }}
        />
      )}
    </div>
  );
}

function LifecycleCheck({ checked }: { checked: boolean }) {
  return checked ? (
    <span className="text-green-600">✓</span>
  ) : (
    <span className="text-gray-300">○</span>
  );
}
