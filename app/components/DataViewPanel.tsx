'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AggregatedProgramData } from '@/lib/types';
import { captureChartAsImage } from '@/lib/chart-capture';
import { SECTION_DATA_MAP, DATA_VIEW_LABELS, DataViewKey } from '@/lib/section-data-mapping';
import { EnrollmentChart } from './charts/EnrollmentChart';
import { SuccessRateChart } from './charts/SuccessRateChart';
import { DemographicsChart } from './charts/DemographicsChart';
import { GenderChart } from './charts/GenderChart';
import { AgeGroupChart } from './charts/AgeGroupChart';
import { HighSchoolsChart } from './charts/HighSchoolsChart';
import { SuccessByEthnicityChart } from './charts/SuccessByEthnicityChart';
import { ModalityChart } from './charts/ModalityChart';
import { RetentionChart } from './charts/RetentionChart';
import { LocationChart } from './charts/LocationChart';
import { FTESChart } from './charts/FTESChart';
import { DegreeApplicableTable } from './charts/DegreeApplicableTable';
import { DataTable } from './charts/DataTable';

const ALL_VIEWS: DataViewKey[] = [
  'enrollment', 'successFall', 'successSpring', 'successSummerWinter',
  'successByEthnicity', 'demographics', 'gender', 'ageGroups',
  'highSchools', 'modality', 'retention', 'location', 'ftes',
  'degreeApplicableCourses', 'notDegreeApplicableCourses',
];

interface DataViewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
  data: AggregatedProgramData | null;
  subjectCodes?: string[];
}

function renderChart(key: DataViewKey, data: AggregatedProgramData, showLabels: boolean) {
  switch (key) {
    case 'enrollment': return <EnrollmentChart data={data.enrollment} showLabels={showLabels} />;
    case 'successFall': return <SuccessRateChart data={data.successFall} label="Fall" showLabels={showLabels} />;
    case 'successSpring': return <SuccessRateChart data={data.successSpring} label="Spring" showLabels={showLabels} />;
    case 'successSummerWinter': return <SuccessRateChart data={data.successSummerWinter} label="Summer/Winter" showLabels={showLabels} />;
    case 'successByEthnicity': return <SuccessByEthnicityChart data={data.successByEthnicity} showLabels={showLabels} />;
    case 'demographics': return <DemographicsChart data={data.demographics} showLabels={showLabels} />;
    case 'gender': return <GenderChart data={data.gender} showLabels={showLabels} />;
    case 'ageGroups': return <AgeGroupChart data={data.ageGroups} showLabels={showLabels} />;
    case 'highSchools': return <HighSchoolsChart data={data.highSchools} showLabels={showLabels} />;
    case 'modality': return <ModalityChart data={data.modality} showLabels={showLabels} />;
    case 'retention': return <RetentionChart data={data.retention} showLabels={showLabels} />;
    case 'location': return <LocationChart data={data.location} showLabels={showLabels} />;
    case 'ftes': return <FTESChart data={data.ftes} showLabels={showLabels} />;
    case 'degreeApplicableCourses': return <DegreeApplicableTable data={data.degreeApplicableCourses} title="Degree Applicable Courses" />;
    case 'notDegreeApplicableCourses': return <DegreeApplicableTable data={data.notDegreeApplicableCourses} title="Non-Degree Applicable Courses" />;
    default: return null;
  }
}

const pct = (v: unknown) => `${Number(v).toFixed(1)}%`;
const num = (v: unknown) => String(Math.round(Number(v)));
const dec = (v: unknown) => Number(v).toFixed(2);

function renderTable(key: DataViewKey, data: AggregatedProgramData) {
  switch (key) {
    case 'enrollment':
      return <DataTable data={data.enrollment} columns={[
        { key: 'term', label: 'Term' }, { key: 'academicYear', label: 'Year' }, { key: 'count', label: 'Count', format: num },
      ]} />;
    case 'successFall': case 'successSpring': case 'successSummerWinter': {
      const d = key === 'successFall' ? data.successFall : key === 'successSpring' ? data.successSpring : data.successSummerWinter;
      return <DataTable data={d} columns={[
        { key: 'term', label: 'Term' }, { key: 'count', label: 'Count', format: num },
        { key: 'successRate', label: 'Success %', format: pct }, { key: 'completionRate', label: 'Completion %', format: pct },
      ]} />;
    }
    case 'successByEthnicity':
      return <DataTable data={data.successByEthnicity} columns={[
        { key: 'academicYear', label: 'Year' }, { key: 'ethnicity', label: 'Ethnicity' },
        { key: 'count', label: 'Count', format: num }, { key: 'successRate', label: 'Success %', format: pct },
      ]} />;
    case 'demographics':
      return <DataTable data={data.demographics} columns={[
        { key: 'ethnicity', label: 'Ethnicity' }, { key: 'count', label: 'Count', format: num }, { key: 'pct', label: '%', format: pct },
      ]} />;
    case 'gender':
      return <DataTable data={data.gender} columns={[
        { key: 'academicYear', label: 'Year' }, { key: 'gender', label: 'Gender' }, { key: 'count', label: 'Count', format: num },
      ]} />;
    case 'ageGroups':
      return <DataTable data={data.ageGroups} columns={[
        { key: 'academicYear', label: 'Year' }, { key: 'ageGroup', label: 'Age Group' }, { key: 'count', label: 'Count', format: num },
      ]} />;
    case 'highSchools':
      return <DataTable data={data.highSchools} columns={[
        { key: 'school', label: 'High School' }, { key: 'count', label: 'Count', format: num }, { key: 'pct', label: '%', format: pct },
      ]} />;
    case 'modality':
      return <DataTable data={data.modality} columns={[
        { key: 'academicYear', label: 'Year' }, { key: 'modeGroup', label: 'Mode' },
        { key: 'count', label: 'Count', format: num }, { key: 'successRate', label: 'Success %', format: pct },
      ]} />;
    case 'retention':
      return <DataTable data={data.retention} columns={[
        { key: 'cohortTerm', label: 'Cohort' }, { key: 'termIndex', label: 'Term Index' }, { key: 'count', label: 'Count', format: num },
      ]} />;
    case 'location':
      return <DataTable data={data.location} columns={[
        { key: 'location', label: 'Location' }, { key: 'count', label: 'Count', format: num }, { key: 'pct', label: '%', format: pct },
      ]} />;
    case 'ftes':
      return <DataTable data={data.ftes} columns={[
        { key: 'academicYear', label: 'Year' }, { key: 'ftes', label: 'FTES', format: dec },
      ]} />;
    case 'degreeApplicableCourses':
      return <DegreeApplicableTable data={data.degreeApplicableCourses} title="Degree Applicable Courses" />;
    case 'notDegreeApplicableCourses':
      return <DegreeApplicableTable data={data.notDegreeApplicableCourses} title="Non-Degree Applicable Courses" />;
    default: return null;
  }
}

export function DataViewPanel({ isOpen, onClose, sectionTitle, sectionId, data, subjectCodes }: DataViewPanelProps) {
  const sectionViews = SECTION_DATA_MAP[sectionId] || [];
  const [showLabels, setShowLabels] = useState(false);
  const [panelWidth, setPanelWidth] = useState(600);
  const [copying, setCopying] = useState<string | null>(null);
  const [tableMode, setTableMode] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('combined');
  const [subjectData, setSubjectData] = useState<AggregatedProgramData | null>(null);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const isResizing = useRef(false);
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isMultiSubject = (subjectCodes?.length || 0) > 1;
  const activeData = selectedSubject === 'combined' ? data : (subjectData ?? data);

  const VIEWS_PER_PAGE = sectionViews.length || 4;
  const remainingViews = ALL_VIEWS.filter(v => !sectionViews.includes(v));
  const totalPages = 1 + Math.ceil(remainingViews.length / VIEWS_PER_PAGE);
  const views = page === 0
    ? sectionViews
    : remainingViews.slice((page - 1) * VIEWS_PER_PAGE, page * VIEWS_PER_PAGE);

  // Reset page and subject when section changes
  useEffect(() => { setPage(0); setSelectedSubject('combined'); }, [sectionId]);

  // Fetch individual subject data when dropdown changes
  useEffect(() => {
    if (selectedSubject === 'combined' || !isOpen) {
      setSubjectData(null);
      return;
    }
    setLoadingSubject(true);
    fetch(`/api/program-data?subject=${selectedSubject}`)
      .then(res => res.json())
      .then(result => {
        if (result.ok) setSubjectData(result.data);
        else setSubjectData(null);
      })
      .catch(() => setSubjectData(null))
      .finally(() => setLoadingSubject(false));
  }, [selectedSubject, isOpen]);

  const handleCopyChart = async (key: string) => {
    const el = chartRefs.current[key];
    if (!el) return;
    setCopying(key);
    try {
      const dataUrl = await captureChartAsImage(el);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setTimeout(() => setCopying(null), 1500);
    } catch (err) {
      console.error('Failed to copy chart:', err);
      setCopying(null);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    setPanelWidth(Math.max(400, Math.min(newWidth, window.innerWidth - 200)));
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startResizing = () => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />
      )}

      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: panelWidth }}
      >
        <div
          onMouseDown={startResizing}
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-500 transition-colors z-10"
        />

        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Institutional Data</h2>
              <p className="text-sm text-slate-500">{sectionTitle}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              Data labels
            </label>
            {isMultiSubject && subjectCodes && (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="combined">All Subjects (Combined)</option>
                {subjectCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            )}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-2 py-0.5 text-xs rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-500 tabular-nums">
                  {page === 0 ? 'Section views' : `More ${page}/${totalPages - 1}`}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="px-2 py-0.5 text-xs rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
            {totalPages <= 1 && (
              <span className="text-xs text-slate-400 ml-auto">Copy a chart, then paste (Ctrl+V) into any section</span>
            )}
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100%-150px)] p-6 space-y-4">
          {loadingSubject ? (
            <div className="text-center py-12 text-slate-500 text-sm">Loading subject data...</div>
          ) : !activeData ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-slate-500">No cached data available for this program.</p>
              <p className="text-sm text-slate-400 mt-1">Run a scrape from Settings to load data.</p>
            </div>
          ) : views.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No data views mapped for this section.</p>
          ) : (
            views.map(key => (
              <div key={key} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-700">Subject: {activeData.subject} — {DATA_VIEW_LABELS[key]}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setTableMode(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="text-xs px-2 py-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors flex items-center gap-1"
                      title={tableMode[key] ? 'Show chart' : 'Show table'}
                    >
                      {tableMode[key] ? (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> Chart</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Table</>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyChart(key)}
                      disabled={copying === key}
                      className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center gap-1"
                    >
                      {copying === key ? (
                        <><svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-4" ref={el => { chartRefs.current[key] = el; }}>
                  {tableMode[key] ? renderTable(key, activeData) : renderChart(key, activeData, showLabels)}
                </div>
              </div>
            ))
          )}
          {activeData && (
            <div className="text-xs text-slate-400 text-center pt-2">
              Data cached: {new Date(activeData.fetchedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
