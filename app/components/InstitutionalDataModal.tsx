'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { AggregatedProgramData } from '@/lib/types';
import { captureChartAsImage } from '@/lib/chart-capture';
import { DATA_VIEW_LABELS, DataViewKey } from '@/lib/section-data-mapping';
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
    case 'successFall':
      return <DataTable data={data.successFall} columns={[
        { key: 'term', label: 'Term' }, { key: 'count', label: 'Count', format: num },
        { key: 'successRate', label: 'Success %', format: pct }, { key: 'completionRate', label: 'Completion %', format: pct },
      ]} />;
    case 'successSpring':
      return <DataTable data={data.successSpring} columns={[
        { key: 'term', label: 'Term' }, { key: 'count', label: 'Count', format: num },
        { key: 'successRate', label: 'Success %', format: pct }, { key: 'completionRate', label: 'Completion %', format: pct },
      ]} />;
    case 'successSummerWinter':
      return <DataTable data={data.successSummerWinter} columns={[
        { key: 'term', label: 'Term' }, { key: 'count', label: 'Count', format: num },
        { key: 'successRate', label: 'Success %', format: pct }, { key: 'completionRate', label: 'Completion %', format: pct },
      ]} />;
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

interface InstitutionalDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstitutionalDataModal: React.FC<InstitutionalDataModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [size, setSize] = useState({ width: 750, height: 560 });
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [showLabels, setShowLabels] = useState(false);
  const [copying, setCopying] = useState<string | null>(null);
  const [tableMode, setTableMode] = useState<Record<string, boolean>>({});
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // All-college aggregated data
  const [collegeData, setCollegeData] = useState<AggregatedProgramData | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!isOpen || hasFetched.current) return;
    hasFetched.current = true;
    setLoadingAll(true);
    (async () => {
      try {
        const res = await fetch('/api/program-data/all');
        const result = await res.json();
        if (result.ok) {
          setCollegeData(result.data);
        }
      } catch {
        // not available
      } finally {
        setLoadingAll(false);
      }
    })();
  }, [isOpen]);

  // Center on first open
  useEffect(() => {
    if (isOpen && position.x === -1) {
      setPosition({
        x: Math.max(40, (window.innerWidth - size.width) / 2),
        y: Math.max(40, (window.innerHeight - size.height) / 2),
      });
    }
  }, [isOpen, position.x, size.width, size.height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    document.body.style.userSelect = 'none';
  }, [position]);

  const handleResizeStart = useCallback((edge: string, e: React.MouseEvent) => {
    e.stopPropagation();
    isResizing.current = edge;
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
      if (isResizing.current) {
        const edge = isResizing.current;
        setSize(prev => {
          let w = prev.width;
          let h = prev.height;
          if (edge.includes('e')) w = Math.max(400, e.clientX - position.x);
          if (edge.includes('s')) h = Math.max(300, e.clientY - position.y);
          if (edge.includes('w')) {
            const dx = e.clientX - position.x;
            w = Math.max(400, prev.width - dx);
            if (w !== prev.width) setPosition(p => ({ ...p, x: e.clientX }));
          }
          if (edge.includes('n')) {
            const dy = e.clientY - position.y;
            h = Math.max(300, prev.height - dy);
            if (h !== prev.height) setPosition(p => ({ ...p, y: e.clientY }));
          }
          return { width: w, height: h };
        });
      }
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = null;
      document.body.style.userSelect = '';
    };

    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, position]);

  const handleCopyChart = useCallback(async (refKey: string) => {
    const el = chartRefs.current[refKey];
    if (!el) return;
    setCopying(refKey);
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
  }, []);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col"
      style={{
        width: size.width,
        height: size.height,
        left: position.x,
        top: position.y,
      }}
    >
      {/* Resize handles */}
      <div onMouseDown={(e) => handleResizeStart('n', e)} className="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize" />
      <div onMouseDown={(e) => handleResizeStart('s', e)} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize" />
      <div onMouseDown={(e) => handleResizeStart('e', e)} className="absolute top-2 bottom-2 right-0 w-1.5 cursor-e-resize" />
      <div onMouseDown={(e) => handleResizeStart('w', e)} className="absolute top-2 bottom-2 left-0 w-1.5 cursor-w-resize" />
      <div onMouseDown={(e) => handleResizeStart('ne', e)} className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" />
      <div onMouseDown={(e) => handleResizeStart('nw', e)} className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" />
      <div onMouseDown={(e) => handleResizeStart('se', e)} className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" />
      <div onMouseDown={(e) => handleResizeStart('sw', e)} className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" />

      {/* Title bar */}
      <div
        onMouseDown={handleMouseDown}
        className="px-4 py-3 border-b border-slate-200 cursor-move bg-slate-50 rounded-t-lg shrink-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-800">Institutional Data — All College</h3>
          </div>
          <button
            onClick={onClose}
            data-no-drag
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-4 mt-2" data-no-drag>
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Data labels
          </label>
          <span className="text-[10px] text-slate-400 ml-auto">Copy a chart, then paste (Ctrl+V) into any section</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" data-no-drag>
        {loadingAll ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading all college data...</div>
        ) : !collegeData ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-slate-500">No cached data available.</p>
            <p className="text-sm text-slate-400 mt-1">Run a scrape from Settings to load data.</p>
          </div>
        ) : (
          <>
            {ALL_VIEWS.map(key => (
              <div key={key} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-700">{DATA_VIEW_LABELS[key]}</h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setTableMode(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="text-[10px] px-2 py-0.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors flex items-center gap-1"
                      title={tableMode[key] ? 'Show chart' : 'Show table'}
                    >
                      {tableMode[key] ? (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> Chart</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Table</>
                      )}
                    </button>
                    <button
                      onClick={() => handleCopyChart(key)}
                      disabled={copying === key}
                      className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center gap-1"
                    >
                      {copying === key ? (
                        <><svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
                      ) : (
                        <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy</>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3" ref={el => { chartRefs.current[key] = el; }}>
                  {tableMode[key] ? renderTable(key, collegeData) : renderChart(key, collegeData, showLabels)}
                </div>
              </div>
            ))}
            <div className="text-xs text-slate-400 text-center pt-1">
              Aggregated from all cached subjects
            </div>
          </>
        )}
      </div>
    </div>
  );
};
