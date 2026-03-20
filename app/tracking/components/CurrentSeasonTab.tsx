'use client';

import { useState, useEffect } from 'react';
import ProgramCard from './ProgramCard';

interface Program {
  name: string;
  type: 'instructional' | 'non_instructional';
  reviewType: 'PR' | 'AU';
  status: 'red' | 'yellow' | 'green';
  draftSubmitted: boolean;
  finalSubmitted: boolean;
  engagementCount: number;
  lastEngagementDate: string | null;
  notes: string;
}

interface CurrentSeasonTabProps {
  year: string;
  filterType: 'all' | 'instructional' | 'non_instructional';
}

export default function CurrentSeasonTab({
  year,
  filterType,
}: CurrentSeasonTabProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPrograms = async () => {
    setIsLoading(true);
    setError('');
    try {
      const typeParam = filterType === 'all' ? '' : `&type=${filterType}`;
      const response = await fetch(`/api/tracking/schedule?year=${year}${typeParam}`);
      if (!response.ok) throw new Error('Failed to fetch programs');
      const data = await response.json();
      setPrograms(data.programs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, [year, filterType]);

  const handleProgramUpdate = () => {
    fetchPrograms();
  };

  // Sort by status: red first, then yellow, then green
  const sortedPrograms = [...programs].sort((a, b) => {
    const statusOrder = { red: 0, yellow: 1, green: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const stats = {
    red: programs.filter((p) => p.status === 'red').length,
    yellow: programs.filter((p) => p.status === 'yellow').length,
    green: programs.filter((p) => p.status === 'green').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading programs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-700">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-lg bg-red-50 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{stats.red}</p>
          <p className="text-sm text-red-600">Need Follow-up</p>
        </div>
        <div className="flex-1 rounded-lg bg-yellow-50 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{stats.yellow}</p>
          <p className="text-sm text-yellow-600">Engaged</p>
        </div>
        <div className="flex-1 rounded-lg bg-green-50 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{stats.green}</p>
          <p className="text-sm text-green-600">Submitted</p>
        </div>
      </div>

      {/* Program Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedPrograms.map((program) => (
          <ProgramCard
            key={program.name}
            {...program}
            academicYear={year}
            onStatusChange={handleProgramUpdate}
          />
        ))}
      </div>

      {sortedPrograms.length === 0 && (
        <div className="rounded-md bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No programs found for this filter</p>
        </div>
      )}
    </div>
  );
}
