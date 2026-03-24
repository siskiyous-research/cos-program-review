'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { GenderRecord } from '@/lib/types';

const GENDER_COLORS: Record<string, string> = { Female: '#e8943a', Male: '#2a6496', '(Blank)': '#888888' };

export function GenderChart({ data, showLabels = false }: { data: GenderRecord[]; showLabels?: boolean }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No gender data</p>;
  const years = [...new Set(data.map(d => d.academicYear))].sort();
  const genders = [...new Set(data.map(d => d.gender))].sort();
  const pivoted = years.map(yr => {
    const row: Record<string, any> = { year: yr };
    for (const g of genders) {
      row[g] = data.find(d => d.academicYear === yr && d.gender === g)?.count || 0;
    }
    return row;
  });
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={pivoted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="year" fontSize={11} />
        <YAxis />
        <Tooltip />
        <Legend />
        {genders.map(g => (
          <Bar key={g} dataKey={g} fill={GENDER_COLORS[g] || '#888'}>
            {showLabels && <LabelList dataKey={g} position="top" fontSize={9} />}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
