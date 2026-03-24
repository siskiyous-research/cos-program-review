'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FTESRecord } from '@/lib/types';

export function FTESChart({ data, showLabels = false }: { data: FTESRecord[]; showLabels?: boolean }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No FTES data</p>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="academicYear" fontSize={11} />
        <YAxis />
        <Tooltip formatter={(v: number) => v.toFixed(2)} />
        <Area type="monotone" dataKey="ftes" fill="#3b82f6" stroke="#1e40af" fillOpacity={0.3}
          label={showLabels ? { position: 'top', fontSize: 10, fontWeight: 'bold', formatter: (v: number) => v.toFixed(2) } : false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
