'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EthnicitySuccessRecord } from '@/lib/types';

const ETH_COLORS: Record<string, string> = {
  'White Non-Hispanic': '#8b7355', 'Hispanic': '#4caf50', 'Two or More Races': '#8e6fbf',
  'Unknown / Not Reported': '#e8a0bf', 'Asian': '#d94f4f', 'African-American': '#2a6496',
  'Filipino': '#5bc0be', 'American Indian/Alaskan Native': '#e8943a', 'Pacific Islander': '#f0c75e',
};

export function SuccessByEthnicityChart({ data, showLabels = false }: { data: EthnicitySuccessRecord[]; showLabels?: boolean }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No ethnicity success data</p>;
  const years = [...new Set(data.map(d => d.academicYear))].sort();
  const ethnicities = [...new Set(data.map(d => d.ethnicity))];
  const pivoted = years.map(yr => {
    const row: Record<string, any> = { year: yr };
    for (const e of ethnicities) {
      const rec = data.find(d => d.academicYear === yr && d.ethnicity === e);
      row[e] = rec?.successRate || null;
    }
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={pivoted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" fontSize={11} />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(v: number) => v !== null ? `${v.toFixed(1)}%` : 'N/A'} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {ethnicities.map(e => (
          <Line key={e} type="monotone" dataKey={e} stroke={ETH_COLORS[e] || '#888'}
                strokeWidth={2} dot={{ r: 3 }} connectNulls name={e}
                label={showLabels ? { position: 'top', fontSize: 7, formatter: (v: number) => `${v.toFixed(0)}%` } : false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
