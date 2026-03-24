'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AggregatedProgramData } from '@/lib/types';

interface DataDashboardProps {
  data: AggregatedProgramData | null;
  isLoading: boolean;
  isScraping?: boolean;
  onTriggerScrape?: () => Promise<void>;
}

const CHARTS_PER_PAGE = 4;

export const DataDashboard: React.FC<DataDashboardProps> = ({ data, isLoading, isScraping, onTriggerScrape }) => {
  const [page, setPage] = useState(0);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-48 bg-slate-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 space-y-3">
        <div className="text-center">
          <div className="text-sm text-slate-500 mb-3">
            <div className="text-4xl mb-2">📊</div>
            No cached data available for this program yet.
          </div>
          {onTriggerScrape && (
            <button
              onClick={onTriggerScrape}
              disabled={isScraping}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isScraping ? 'Scraping...' : 'Refresh Data Now'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const charts = [
    {
      title: 'Enrollment Trend',
      render: () => (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.enrollment}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="term" fontSize={11} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Success Rates (Fall)',
      render: () => (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.successFall}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="term" fontSize={11} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="successRate" stroke="#10b981" name="Success %" />
            <Line type="monotone" dataKey="completionRate" stroke="#f59e0b" name="Completion %" />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'Demographics',
      render: () => (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.demographics} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="ethnicity" type="category" width={75} fontSize={11} />
            <Tooltip />
            <Bar dataKey="pct" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'FTES Trend',
      render: () => (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.ftes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="academicYear" fontSize={11} />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="ftes" fill="#3b82f6" stroke="#1e40af" />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
  ];

  // Add additional charts if the data has extra fields
  if (data.modality && data.modality.length > 0) {
    charts.push({
      title: 'Modality',
      render: () => (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.modality}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="modality" fontSize={11} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      ),
    });
  }

  if (data.retention && data.retention.length > 0) {
    charts.push({
      title: 'Retention',
      render: () => (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.retention}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="term" fontSize={11} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="rate" stroke="#ec4899" name="Retention %" />
          </LineChart>
        </ResponsiveContainer>
      ),
    });
  }

  const totalPages = Math.ceil(charts.length / CHARTS_PER_PAGE);
  const visibleCharts = charts.slice(page * CHARTS_PER_PAGE, (page + 1) * CHARTS_PER_PAGE);

  return (
    <div className="space-y-1">
      <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
        <span>Updated: {new Date(data.fetchedAt).toLocaleString()}</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-1.5 py-0.5 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-[10px] tabular-nums">{page + 1}/{totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-1.5 py-0.5 rounded text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
      {visibleCharts.map((chart, idx) => (
        <div key={page * CHARTS_PER_PAGE + idx} className="px-4 py-3 border-b border-slate-100">
          <h4 className="text-xs font-medium text-slate-600 mb-2">{chart.title}</h4>
          {chart.render()}
        </div>
      ))}
    </div>
  );
};
