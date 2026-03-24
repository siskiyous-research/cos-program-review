'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { EnrollmentRecord } from '@/lib/types';

const YEAR_COLORS: Record<string, string> = {
  '2021-2022': '#2a6496', '2022-2023': '#e8943a', '2023-2024': '#d94f4f',
  '2024-2025': '#5bc0be', '2025-2026': '#4caf50',
};

export function EnrollmentChart({ data, showLabels = false }: { data: EnrollmentRecord[]; showLabels?: boolean }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No enrollment data</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="term" fontSize={11} angle={-35} textAnchor="end" height={60} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count">
          {showLabels && <LabelList dataKey="count" position="top" fontSize={10} fontWeight="bold" />}
          {data.map((d, i) => (
            <Cell key={i} fill={YEAR_COLORS[d.academicYear] || '#3b82f6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
