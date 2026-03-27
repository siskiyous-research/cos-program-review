'use client';

import type { SLOProgramSummary } from '@/lib/slo-types';

interface Props {
  summaries: SLOProgramSummary[];
  onSelectProgram: (program: string) => void;
}

export default function SLOProgramRollup({ summaries, onSelectProgram }: Props) {
  if (summaries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center text-gray-500">
        No programs match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {summaries.map((summary) => {
        const total = summary.totalCourses;
        const pctNotStarted = (summary.notStarted / total) * 100;
        const pctInProgress = (summary.inProgress / total) * 100;
        const pctAssessed = (summary.assessed / total) * 100;
        const pctAnalyzed = (summary.analyzed / total) * 100;
        const pctComplete = (summary.complete / total) * 100;

        return (
          <div
            key={summary.programName}
            className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelectProgram(summary.programName)}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium text-gray-900">{summary.programName}</span>
                <span className="ml-2 text-xs text-gray-400">{summary.division}</span>
              </div>
              <div className="text-sm text-gray-600">
                {summary.complete}/{total} complete ({summary.completionRate}%)
              </div>
            </div>

            {/* Stacked progress bar */}
            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100 flex">
              {pctComplete > 0 && (
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${pctComplete}%` }}
                  title={`Complete: ${summary.complete}`}
                />
              )}
              {pctAnalyzed > 0 && (
                <div
                  className="bg-green-400 h-full transition-all"
                  style={{ width: `${pctAnalyzed}%` }}
                  title={`Analyzed: ${summary.analyzed}`}
                />
              )}
              {pctAssessed > 0 && (
                <div
                  className="bg-blue-400 h-full transition-all"
                  style={{ width: `${pctAssessed}%` }}
                  title={`Assessed: ${summary.assessed}`}
                />
              )}
              {pctInProgress > 0 && (
                <div
                  className="bg-yellow-400 h-full transition-all"
                  style={{ width: `${pctInProgress}%` }}
                  title={`In Progress: ${summary.inProgress}`}
                />
              )}
              {pctNotStarted > 0 && (
                <div
                  className="bg-red-200 h-full transition-all"
                  style={{ width: `${pctNotStarted}%` }}
                  title={`Not Started: ${summary.notStarted}`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
              {summary.complete > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Complete ({summary.complete})</span>}
              {summary.analyzed > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" /> Analyzed ({summary.analyzed})</span>}
              {summary.assessed > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> Assessed ({summary.assessed})</span>}
              {summary.inProgress > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" /> In Progress ({summary.inProgress})</span>}
              {summary.notStarted > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-200" /> Not Started ({summary.notStarted})</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
