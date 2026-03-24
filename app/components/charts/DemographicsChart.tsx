'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { DemographicRecord } from '@/lib/types';

export function DemographicsChart({ data, showLabels = false }: { data: DemographicRecord[]; showLabels?: boolean }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No demographics data</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 35)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="ethnicity" type="category" width={80} fontSize={10} />
        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
        <Bar dataKey="pct" fill="#3b82f6" name="%">
          {showLabels && <LabelList dataKey="pct" position="right" fontSize={10} formatter={(v: number) => `${v.toFixed(1)}%`} />}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
