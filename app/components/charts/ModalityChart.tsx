'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { ModalityRecord } from '@/lib/types';

const MODE_COLORS: Record<string, string> = { 'Distance Ed': '#2a6496', 'In-Person': '#e8943a' };

export function ModalityChart({ data }: { data: ModalityRecord[] }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No modality data</p>;
  const years = [...new Set(data.map(d => d.academicYear))].sort();
  const modes = [...new Set(data.map(d => d.modeGroup))];
  const pivoted = years.map(yr => {
    const row: Record<string, any> = { year: yr };
    for (const m of modes) {
      const rec = data.find(d => d.academicYear === yr && d.modeGroup === m);
      row[`${m}_count`] = rec?.count || 0;
      row[`${m}_rate`] = rec?.successRate || 0;
    }
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={pivoted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" fontSize={11} />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {modes.map(m => (
          <Bar key={m} yAxisId="left" dataKey={`${m}_count`} fill={MODE_COLORS[m] || '#888'} name={`${m} (count)`} />
        ))}
        {modes.map(m => (
          <Line key={`${m}_line`} yAxisId="right" type="monotone" dataKey={`${m}_rate`}
                stroke={MODE_COLORS[m] || '#888'} strokeWidth={2} dot={{ r: 3 }}
                name={`${m} (success %)`} strokeDasharray="5 5" />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
