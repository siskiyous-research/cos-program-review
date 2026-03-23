'use client';

import { AggregatedProgramData } from '@/lib/types';
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

interface DataViewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sectionTitle: string;
  sectionId: string;
  data: AggregatedProgramData | null;
}

function renderChart(key: DataViewKey, data: AggregatedProgramData) {
  switch (key) {
    case 'enrollment': return <EnrollmentChart data={data.enrollment} />;
    case 'successFall': return <SuccessRateChart data={data.successFall} label="Fall" />;
    case 'successSpring': return <SuccessRateChart data={data.successSpring} label="Spring" />;
    case 'successSummerWinter': return <SuccessRateChart data={data.successSummerWinter} label="Summer/Winter" />;
    case 'successByEthnicity': return <SuccessByEthnicityChart data={data.successByEthnicity} />;
    case 'demographics': return <DemographicsChart data={data.demographics} />;
    case 'gender': return <GenderChart data={data.gender} />;
    case 'ageGroups': return <AgeGroupChart data={data.ageGroups} />;
    case 'highSchools': return <HighSchoolsChart data={data.highSchools} />;
    case 'modality': return <ModalityChart data={data.modality} />;
    case 'retention': return <RetentionChart data={data.retention} />;
    case 'location': return <LocationChart data={data.location} />;
    case 'ftes': return <FTESChart data={data.ftes} />;
    case 'degreeApplicableCourses': return <DegreeApplicableTable data={data.degreeApplicableCourses} title="Degree Applicable Courses" />;
    case 'notDegreeApplicableCourses': return <DegreeApplicableTable data={data.notDegreeApplicableCourses} title="Non-Degree Applicable Courses" />;
    default: return null;
  }
}

export function DataViewPanel({ isOpen, onClose, sectionTitle, sectionId, data }: DataViewPanelProps) {
  const views = SECTION_DATA_MAP[sectionId] || [];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Institutional Data</h2>
            <p className="text-sm text-slate-500">{sectionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-73px)] p-6 space-y-4">
          {!data ? (
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
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700">{DATA_VIEW_LABELS[key]}</h3>
                </div>
                <div className="p-4">
                  {renderChart(key, data)}
                </div>
              </div>
            ))
          )}

          {data && (
            <div className="text-xs text-slate-400 text-center pt-2">
              Data cached: {new Date(data.fetchedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
