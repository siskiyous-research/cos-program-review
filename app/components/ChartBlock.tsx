'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartBlockProps {
  type: 'bar' | 'line' | 'area' | 'horizontalBar' | 'pie';
  title?: string;
  xKey?: string;
  yKey?: string;
  data: any[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const ChartBlock: React.FC<ChartBlockProps> = ({ type, title, xKey, yKey, data }) => {
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-sm p-4">No data available for chart</div>;
  }

  try {
    switch (type) {
      case 'bar':
        return (
          <div className="space-y-2">
            {title && <h4 className="text-sm font-medium text-slate-700">{title}</h4>}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                {yKey && <Bar dataKey={yKey} fill="#3b82f6" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'line':
        return (
          <div className="space-y-2">
            {title && <h4 className="text-sm font-medium text-slate-700">{title}</h4>}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                {yKey && <Line type="monotone" dataKey={yKey} stroke="#3b82f6" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'area':
        return (
          <div className="space-y-2">
            {title && <h4 className="text-sm font-medium text-slate-700">{title}</h4>}
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                {yKey && <Area type="monotone" dataKey={yKey} fill="#3b82f6" stroke="#1e40af" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'horizontalBar':
        return (
          <div className="space-y-2">
            {title && <h4 className="text-sm font-medium text-slate-700">{title}</h4>}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey={xKey} type="category" width={95} />
                <Tooltip />
                <Legend />
                {yKey && <Bar dataKey={yKey} fill="#3b82f6" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie':
        return (
          <div className="space-y-2">
            {title && <h4 className="text-sm font-medium text-slate-700">{title}</h4>}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey={yKey || 'value'}
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return <div className="text-slate-500 text-sm p-4">Unknown chart type: {type}</div>;
    }
  } catch (error) {
    console.error('Chart render error:', error);
    return <div className="text-red-500 text-sm p-4">Error rendering chart</div>;
  }
};
