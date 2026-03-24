'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { RetentionRecord } from '@/lib/types';

const RETENTION_COLORS: Record<string, string> = { 'Year 1, Term 1': '#6b6b6b', 'Year 2, Term 1': '#d4829c' };

export function RetentionChart({ data, showLabels = false }: { data: RetentionRecord[]; showLabels?: boolean }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No retention data</p>;
  const cohorts = [...new Set(data.map(d => d.cohortTerm))];
  const indices = [...new Set(data.map(d => d.termIndex))].sort();
  const pivoted = cohorts.map(c => {
    const row: Record<string, any> = { cohort: c };
    for (const idx of indices) {
      const label = typeof idx === 'string' ? idx : `Term ${idx}`;
      row[label] = data.find(d => d.cohortTerm === c && d.termIndex === idx)?.count || 0;
    }
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={pivoted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="cohort" fontSize={11} />
        <YAxis />
        <Tooltip />
        <Legend />
        {indices.map(idx => {
          const label = typeof idx === 'string' ? idx : `Term ${idx}`;
          return (
            <Bar key={label} dataKey={label} fill={RETENTION_COLORS[label] || '#888'}>
              {showLabels && <LabelList dataKey={label} position="top" fontSize={9} />}
            </Bar>
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
}
