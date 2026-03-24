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

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const DataDashboard: React.FC<DataDashboardProps> = ({ data, isLoading, isScraping, onTriggerScrape }) => {
  const [expandedTab, setExpandedTab] = useState<number | null>(0);

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
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.enrollment}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="term" fontSize={12} />
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
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.successFall}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="term" fontSize={12} />
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
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.demographics} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="ethnicity" type="category" width={95} fontSize={12} />
            <Tooltip />
            <Bar dataKey="pct" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      title: 'FTES Trend',
      render: () => (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data.ftes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="academicYear" fontSize={12} />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="ftes" fill="#3b82f6" stroke="#1e40af" />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500">
        <span>Updated: {new Date(data.fetchedAt).toLocaleString()}</span>
      </div>
      {charts.map((chart, idx) => (
        <div key={idx} className="border border-slate-200 rounded">
          <button
            onClick={() => setExpandedTab(expandedTab === idx ? null : idx)}
            className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex justify-between items-center"
          >
            <span className="text-sm font-medium text-slate-700">{chart.title}</span>
            <svg className={`w-4 h-4 transition-transform ${expandedTab === idx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
          {expandedTab === idx && (
            <div className="p-4 border-t border-slate-200 bg-white">
              {chart.render()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
