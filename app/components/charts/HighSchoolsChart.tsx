'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HighSchoolRecord } from '@/lib/types';

export function HighSchoolsChart({ data }: { data: HighSchoolRecord[] }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No high school data</p>;
  const reversed = [...data].reverse();
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 28)}>
      <BarChart data={reversed} layout="vertical" margin={{ left: 140 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="school" type="category" width={135} fontSize={10} />
        <Tooltip formatter={(v: number, name: string) => name === 'pct' ? `${v}%` : v} />
        <Bar dataKey="count" fill="#d94f4f" name="Students" />
      </BarChart>
    </ResponsiveContainer>
  );
}
