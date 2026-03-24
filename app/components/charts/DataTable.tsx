'use client';

/**
 * Generic styled data table component
 * Renders any array of objects as a clean table
 */

interface DataTableProps {
  data: Record<string, any>[];
  columns: { key: string; label: string; format?: (v: any) => string }[];
  title?: string;
}

export function DataTable({ data, columns, title }: DataTableProps) {
  if (!data?.length) return <p className="text-sm text-slate-400 p-4">No data</p>;
  return (
    <div className="overflow-x-auto">
      {title && <h4 className="text-xs font-semibold text-slate-500 mb-2">{title}</h4>}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-700 text-white">
            {columns.map(col => (
              <th key={col.key} className="px-3 py-2 text-left text-xs font-semibold">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              {columns.map(col => (
                <td key={col.key} className="px-3 py-1.5 text-slate-700 text-xs border-t border-slate-100">
                  {col.format ? col.format(row[col.key]) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
