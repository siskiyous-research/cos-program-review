'use client';
import { CourseRecord } from '@/lib/types';

export function DegreeApplicableTable({ data, title }: { data: CourseRecord[]; title: string }) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No {title.toLowerCase()} data</p>;
  const totalCount = data.reduce((s, d) => s + d.count, 0);
  const avgWithdrawal = totalCount > 0
    ? data.reduce((s, d) => s + (d.withdrawalRate * d.count), 0) / totalCount
    : 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="px-3 py-2 font-medium text-slate-700">Course</th>
            <th className="px-3 py-2 font-medium text-slate-700">Title</th>
            <th className="px-3 py-2 font-medium text-slate-700 text-right">Count</th>
            <th className="px-3 py-2 font-medium text-slate-700 text-right">Withdrawal %</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-3 py-1.5 text-slate-600 font-mono text-xs">{row.courseNumber}</td>
              <td className="px-3 py-1.5 text-slate-600">{row.title}</td>
              <td className="px-3 py-1.5 text-slate-600 text-right">{row.count}</td>
              <td className="px-3 py-1.5 text-slate-600 text-right">{row.withdrawalRate.toFixed(0)}%</td>
            </tr>
          ))}
          <tr className="border-t-2 border-slate-300 font-semibold">
            <td className="px-3 py-2 text-slate-800" colSpan={2}>Total</td>
            <td className="px-3 py-2 text-slate-800 text-right">{totalCount}</td>
            <td className="px-3 py-2 text-slate-800 text-right">{avgWithdrawal.toFixed(0)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
