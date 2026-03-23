'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LocationRecord } from '@/lib/types';

export function LocationChart({ data }: { data: LocationRecord[] }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No location data</p>;
  const reversed = [...data].reverse();
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 35)}>
      <BarChart data={reversed} layout="vertical" margin={{ left: 100 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="location" type="category" width={95} fontSize={11} />
        <Tooltip formatter={(v: number, name: string) => name === 'pct' ? `${v}%` : v} />
        <Bar dataKey="count" fill="#2a6496" name="Students" />
      </BarChart>
    </ResponsiveContainer>
  );
}
