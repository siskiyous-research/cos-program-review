'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { AgeGroupRecord } from '@/lib/types';

const AGE_COLORS: Record<string, string> = {
  '19 or Less': '#2a6496', '20-24': '#e8943a', '25-29': '#d94f4f',
  '30-34': '#5bc0be', '35-39': '#4caf50', '40-49': '#f0c75e',
  '50 +': '#8e6fbf', 'Unknown': '#ffb6c1',
};

export function AgeGroupChart({ data, showLabels = false }: { data: AgeGroupRecord[]; showLabels?: boolean }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No age group data</p>;
  const years = [...new Set(data.map(d => d.academicYear))].sort();
  const groups = [...new Set(data.map(d => d.ageGroup))];
  const pivoted = years.map(yr => {
    const row: Record<string, any> = { year: yr };
    for (const g of groups) {
      row[g] = data.find(d => d.academicYear === yr && d.ageGroup === g)?.count || 0;
    }
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={pivoted} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="year" type="category" fontSize={11} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {groups.map(g => (
          <Bar key={g} dataKey={g} stackId="a" fill={AGE_COLORS[g] || '#888'}>
            {showLabels && <LabelList dataKey={g} position="center" fontSize={8} fill="#fff" />}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
