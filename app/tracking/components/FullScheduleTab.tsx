'use client';

import { useEffect, useState } from 'react';
import { getAllYears, INSTRUCTIONAL_SCHEDULE, NON_INSTRUCTIONAL_SCHEDULE } from '@/lib/tracking-schedule';

interface ScheduleEntry {
  name: string;
  type: 'instructional' | 'non_instructional';
  years: Record<string, 'PR' | 'AU'>;
}

interface FullScheduleTabProps {
  currentYear: string;
}

export default function FullScheduleTab({ currentYear }: FullScheduleTabProps) {
  const [programs, setPrograms] = useState<ScheduleEntry[]>([]);
  const [years, setYears] = useState<string[]>([]);

  useEffect(() => {
    const allPrograms = [...INSTRUCTIONAL_SCHEDULE, ...NON_INSTRUCTIONAL_SCHEDULE];
    setPrograms(allPrograms);
    setYears(getAllYears());
  }, []);

  if (programs.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
              Program
            </th>
            {years.map((year) => (
              <th
                key={year}
                className={`border border-gray-300 px-3 py-2 text-center text-sm font-semibold ${
                  year === currentYear ? 'bg-blue-50' : ''
                }`}
              >
                {year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {programs.map((program) => (
            <tr key={program.name} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">
                <div>
                  <p className="font-medium text-gray-900">{program.name}</p>
                  <p className="text-xs text-gray-500">
                    {program.type === 'instructional' ? 'Instructional' : 'Non-Instructional'}
                  </p>
                </div>
              </td>
              {years.map((year) => {
                const reviewType = program.years[year];
                const isCurrentYear = year === currentYear;
                const isPR = reviewType === 'PR';

                return (
                  <td
                    key={`${program.name}-${year}`}
                    className={`border border-gray-300 px-3 py-2 text-center text-sm font-medium ${
                      isCurrentYear
                        ? isPR
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-50 text-blue-600'
                        : ''
                    }`}
                  >
                    {reviewType ? (
                      <span className={`inline-block rounded px-2 py-1 ${
                        isPR ? 'bg-red-200 text-red-700' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {reviewType}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-xs text-gray-600">
        <p>PR = Program Review (due December 15) | AU = Annual Update</p>
        <p className="mt-2 flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded bg-blue-50"></span>
          Current year highlighted
        </p>
      </div>
    </div>
  );
}
