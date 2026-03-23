'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SuccessRecord } from '@/lib/types';

export function SuccessRateChart({ data, label }: { data: SuccessRecord[]; label: string }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No {label} success data</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="term" fontSize={11} angle={-35} textAnchor="end" height={60} />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
        <Legend />
        <Line type="monotone" dataKey="successRate" stroke="#10b981" name="Success %" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="completionRate" stroke="#f59e0b" name="Completion %" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
