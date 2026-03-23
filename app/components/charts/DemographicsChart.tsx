'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DemographicRecord } from '@/lib/types';

export function DemographicsChart({ data }: { data: DemographicRecord[] }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No demographics data</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 35)}>
      <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="ethnicity" type="category" width={115} fontSize={11} />
        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
        <Bar dataKey="pct" fill="#3b82f6" name="%" />
      </BarChart>
    </ResponsiveContainer>
  );
}
