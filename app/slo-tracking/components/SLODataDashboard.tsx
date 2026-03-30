'use client';

import { useState, useEffect, useMemo, Component, type ReactNode } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell, LabelList,
} from 'recharts';

// Inline error boundary to isolate chart rendering errors
class ChartErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700">Chart rendering error:</p>
          <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap">{this.state.error.message}</pre>
          <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap max-h-32 overflow-auto">{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

interface TermBreakdown {
  total: number;
  met: number;
  not_met: number;
  met_pct: number;
  not_met_pct: number;
  levels: Record<string, number>;
}

interface AggData {
  label: string;
  total: number;
  met: number;
  not_met: number;
  met_pct: number;
  not_met_pct: number;
  levels: Record<string, number>;
  by_term?: Record<string, TermBreakdown>;
}

interface TermData extends AggData {
  termcode: string;
}

interface Aggregations {
  by_ethnicity: AggData[];
  by_age_group: AggData[];
  by_gender: AggData[];
  by_modality: AggData[];
  by_slo_type: AggData[];
  by_term: TermData[];
  by_division: AggData[];
  overall: {
    total_assessments: number;
    met: number;
    not_met: number;
    met_pct: number;
    unique_students: number;
    unique_courses: number;
    terms_covered: number;
  };
}

interface Payload {
  institution: Aggregations;
  by_subject: Record<string, Aggregations>;
  by_course: Record<string, Aggregations>;
  metadata: {
    subjects: string[];
    courses: string[];
    terms: { termcode: string; label: string }[];
    total_rows: number;
  };
}

type Tab = 'ethnicity' | 'age' | 'gender' | 'modality' | 'type' | 'division' | 'trends';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ethnicity', label: 'Ethnicity' },
  { key: 'age', label: 'Age Group' },
  { key: 'gender', label: 'Gender' },
  { key: 'modality', label: 'Modality' },
  { key: 'type', label: 'SLO Type' },
  { key: 'division', label: 'Division' },
  { key: 'trends', label: 'Trends' },
];

const LEVEL_COLORS: Record<string, string> = {
  'Does not meet expectations': '#94a3b8',
  'Does not meet': '#94a3b8',
  'Exceeds expectations': '#059669',
  'Exceeds Expectations': '#059669',
  'Meets expectations': '#eab308',
  'Meets Expectations': '#eab308',
  'NA': '#d1d5db',
};

function termcodeToYear(tc: string): string {
  if (!tc || tc.length !== 6) return '';
  const year = parseInt(tc.slice(0, 4));
  const season = parseInt(tc.slice(4));
  // Academic year: Fall starts the year, Winter/Spring/Summer end it
  if (season >= 70) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

const DataLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || value === 0) return null;
  return (
    <text x={x + (width || 0) / 2} y={y - 5} fill="#374151" fontSize={10} textAnchor="middle">
      {value}%
    </text>
  );
};

const HorizontalDataLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || value === 0) return null;
  return (
    <text x={x + (width || 0) + 4} y={y + (height || 0) / 2 + 4} fill="#374151" fontSize={10} textAnchor="start">
      {value}%
    </text>
  );
};

export default function SLODataDashboard({ courseFilter: courseFilterProp }: { courseFilter?: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('ethnicity');
  const [viewMode, setViewMode] = useState<'levels' | 'achieved'>('achieved');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [courseCodeFilter, setCourseCodeFilter] = useState<string>('all');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/data/slo_aggregated.json')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Compute academic years from terms
  const academicYears = useMemo(() => {
    if (!data) return [];
    const years = new Set<string>();
    for (const t of data.metadata.terms) {
      const y = termcodeToYear(t.termcode);
      if (y) years.add(y);
    }
    return [...years].sort();
  }, [data]);

  // Filter terms by academic year
  const filteredTerms = useMemo(() => {
    if (!data) return [];
    if (yearFilter === 'all') return data.metadata.terms;
    return data.metadata.terms.filter(t => termcodeToYear(t.termcode) === yearFilter);
  }, [data, yearFilter]);

  // Get the set of active termcodes based on filters
  const activeTermcodes = useMemo(() => {
    if (termFilter !== 'all') return new Set([termFilter]);
    if (yearFilter !== 'all') return new Set(filteredTerms.map(t => t.termcode));
    return null; // null means all terms
  }, [termFilter, yearFilter, filteredTerms]);

  // Courses filtered by subject
  const filteredCourses = useMemo(() => {
    if (!data) return [];
    if (subjectFilter === 'all') return data.metadata.courses;
    return data.metadata.courses.filter(c => c.startsWith(subjectFilter + '-'));
  }, [data, subjectFilter]);

  if (loading) return <div className="py-8 text-center text-gray-500">Loading SLO data...</div>;
  if (!data) return <div className="py-8 text-center text-gray-500">No SLO data available. Run the aggregation script first.</div>;

  // Determine the active course filter (prop overrides dropdown)
  const activeCourse = courseFilterProp || (courseCodeFilter !== 'all' ? courseCodeFilter : null);

  // Select aggregation level
  let agg: Aggregations;
  if (activeCourse && data.by_course[activeCourse]) {
    agg = data.by_course[activeCourse];
  } else if (subjectFilter !== 'all' && data.by_subject[subjectFilter]) {
    agg = data.by_subject[subjectFilter];
  } else {
    agg = data.institution;
  }

  // Apply term filter to dimension data
  function filterByTerm(items: AggData[]): AggData[] {
    if (!activeTermcodes) return items;
    return items.map(item => {
      if (!item.by_term) return item;
      let total = 0, met = 0, not_met = 0;
      const levels: Record<string, number> = {};
      for (const tc of activeTermcodes) {
        const td = item.by_term[tc];
        if (!td) continue;
        total += td.total;
        met += td.met;
        not_met += td.not_met;
        for (const [l, c] of Object.entries(td.levels)) {
          levels[l] = (levels[l] || 0) + c;
        }
      }
      return {
        ...item,
        total, met, not_met,
        met_pct: total > 0 ? Math.round(met / total * 1000) / 10 : 0,
        not_met_pct: total > 0 ? Math.round(not_met / total * 1000) / 10 : 0,
        levels,
      };
    }).filter(item => item.total > 0);
  }

  // Filter trend data by year
  function filterTrends(terms: TermData[]): TermData[] {
    if (yearFilter === 'all' && termFilter === 'all') return terms;
    if (termFilter !== 'all') return terms.filter(t => t.termcode === termFilter);
    return terms.filter(t => activeTermcodes?.has(t.termcode));
  }

  // Get filtered chart data
  const getChartData = (): AggData[] | TermData[] => {
    switch (tab) {
      case 'ethnicity': return filterByTerm(agg.by_ethnicity);
      case 'age': return filterByTerm(agg.by_age_group);
      case 'gender': return filterByTerm(agg.by_gender);
      case 'modality': return filterByTerm(agg.by_modality);
      case 'type': return filterByTerm(agg.by_slo_type);
      case 'division': return filterByTerm(agg.by_division);
      case 'trends': return filterTrends(agg.by_term);
    }
  };

  const chartData = getChartData();

  // Compute filtered overall stats
  const overall = useMemo(() => {
    if (!activeTermcodes) return agg.overall;
    // Re-compute from trend data
    let total = 0, met = 0;
    for (const td of agg.by_term) {
      if (activeTermcodes.has(td.termcode)) {
        total += td.total;
        met += td.met;
      }
    }
    return {
      ...agg.overall,
      total_assessments: total,
      met,
      not_met: total - met,
      met_pct: total > 0 ? Math.round(met / total * 1000) / 10 : 0,
    };
  }, [agg, activeTermcodes]);

  // Get unique proficiency levels
  const allLevels = new Set<string>();
  for (const d of chartData) {
    for (const l of Object.keys(d.levels)) allLevels.add(l);
  }

  // Build chart data
  const levelBarData = chartData.map(d => {
    const total = d.total;
    const entry: Record<string, any> = { name: d.label };
    for (const level of allLevels) {
      const count = d.levels[level] || 0;
      entry[level] = total > 0 ? Math.round(count / total * 100) : 0;
    }
    return entry;
  });

  const achievedBarData = chartData.map(d => ({
    name: d.label,
    Met: d.met_pct,
    'Not Met': d.not_met_pct,
  }));

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <ChartErrorBoundary>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Assessments" value={String(overall.total_assessments ?? 0)} />
        <StatCard label="Proficiency Rate" value={`${overall.met_pct ?? 0}%`} color="text-green-600" />
        <StatCard label="Unique Students" value={String(overall.unique_students ?? 0)} />
        <StatCard label="Courses" value={String(overall.unique_courses ?? 0)} />
      </div>
      </ChartErrorBoundary>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {!courseFilterProp && (
          <>
            <select
              value={subjectFilter}
              onChange={(e) => { setSubjectFilter(e.target.value); setCourseCodeFilter('all'); }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="all">All Subjects</option>
              {data.metadata.subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={courseCodeFilter}
              onChange={(e) => setCourseCodeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="all">All Courses</option>
              {filteredCourses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </>
        )}

        <select
          value={yearFilter}
          onChange={(e) => { setYearFilter(e.target.value); setTermFilter('all'); }}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">All Academic Years</option>
          {academicYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={termFilter}
          onChange={(e) => setTermFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="all">All Terms</option>
          {filteredTerms.map(t => (
            <option key={t.termcode} value={t.termcode}>{t.label}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setViewMode('achieved')}
            className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'achieved' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Proficiency Achieved
          </button>
          <button
            onClick={() => setViewMode('levels')}
            className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'levels' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            Proficiency Levels
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ChartErrorBoundary>
      <div className="rounded-lg border border-gray-200 p-4 bg-white">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {TABS.find(t => t.key === tab)?.label} by {viewMode === 'achieved' ? 'Proficiency Achieved' : 'Proficiency Level'}
          {activeCourse && <span className="text-blue-500 font-normal"> — {activeCourse}</span>}
          {!activeCourse && subjectFilter !== 'all' && <span className="text-blue-500 font-normal"> — {subjectFilter}</span>}
          {yearFilter !== 'all' && <span className="text-gray-400 font-normal"> — {yearFilter}</span>}
          {termFilter !== 'all' && <span className="text-gray-400 font-normal"> — {filteredTerms.find(t => t.termcode === termFilter)?.label}</span>}
        </h3>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No data for the selected filters.</div>
        ) : tab === 'trends' ? (
          <ResponsiveContainer width="100%" height={380}>
            {viewMode === 'achieved' ? (
              <LineChart data={achievedBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="Met" stroke="#059669" strokeWidth={2} dot={{ r: 5 }}>
                  <LabelList dataKey="Met" position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fill: '#059669' }} />
                </Line>
                <Line type="monotone" dataKey="Not Met" stroke="#3b82f6" strokeWidth={2} dot={{ r: 5 }}>
                  <LabelList dataKey="Not Met" position="bottom" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fill: '#3b82f6' }} />
                </Line>
              </LineChart>
            ) : (
              <LineChart data={levelBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                {[...allLevels].map(level => (
                  <Line key={level} type="monotone" dataKey={level} stroke={LEVEL_COLORS[level] || '#6b7280'} strokeWidth={2} dot={{ r: 5 }}>
                    <LabelList dataKey={level} position="top" formatter={(v: number) => `${v}%`} style={{ fontSize: 10 }} />
                  </Line>
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(350, chartData.length * 40)}>
            {viewMode === 'achieved' ? (
              <BarChart data={achievedBarData} layout="vertical" margin={{ right: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit="%" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                <Bar dataKey="Met" fill="#059669" stackId="a">
                  <LabelList dataKey="Met" position="center" formatter={(v: number) => v > 5 ? `${v}%` : ''} style={{ fontSize: 10, fill: '#fff', fontWeight: 'bold' }} />
                </Bar>
                <Bar dataKey="Not Met" fill="#93c5fd" stackId="a">
                  <LabelList dataKey="Not Met" position="center" formatter={(v: number) => v > 5 ? `${v}%` : ''} style={{ fontSize: 10, fill: '#1e3a5f', fontWeight: 'bold' }} />
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={levelBarData} margin={{ top: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                <YAxis unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend />
                {[...allLevels].map(level => (
                  <Bar key={level} dataKey={level} fill={LEVEL_COLORS[level] || '#6b7280'}>
                    <LabelList dataKey={level} position="top" formatter={(v: number) => v > 3 ? `${v}%` : ''} style={{ fontSize: 9, fill: '#374151' }} />
                  </Bar>
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      </ChartErrorBoundary>

      {/* Data table */}
      <div className="rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">
                {TABS.find(t => t.key === tab)?.label}
              </th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Total</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Met</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Not Met</th>
              <th className="px-4 py-2 text-right font-medium text-gray-600">Met %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {chartData.map((d, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-900">{d.label}</td>
                <td className="px-4 py-2 text-right text-gray-600">{d.total.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-green-600">{d.met.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-red-600">{d.not_met.toLocaleString()}</td>
                <td className="px-4 py-2 text-right font-medium">{d.met_pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 text-center">
      <div className={`text-2xl font-bold ${color || 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
