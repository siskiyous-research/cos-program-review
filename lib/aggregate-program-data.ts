/**
 * Shared aggregation utilities for combining multiple subjects' data
 * Used by /api/program-data/all (college-wide) and /api/program-data/combined (multi-subject programs)
 */

import {
  AggregatedProgramData,
  EnrollmentRecord,
  SuccessRecord,
  EthnicitySuccessRecord,
  DemographicRecord,
  GenderRecord,
  AgeGroupRecord,
  ModalityRecord,
  RetentionRecord,
  HighSchoolRecord,
  FTESRecord,
  CourseRecord,
  LocationRecord,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sumByKey<T extends Record<string, any>>(
  arrays: T[][],
  groupKey: string | string[],
  sumKeys: string[],
  avgKeys: string[] = [],
): T[] {
  const keys = Array.isArray(groupKey) ? groupKey : [groupKey];
  const map = new Map<string, { sum: Record<string, number>; count: number; row: T }>();

  for (const arr of arrays) {
    for (const item of arr) {
      const k = keys.map(gk => String(item[gk])).join('|');
      const existing = map.get(k);
      if (existing) {
        for (const sk of sumKeys) existing.sum[sk] = (existing.sum[sk] || 0) + (Number(item[sk]) || 0);
        for (const ak of avgKeys) existing.sum[ak] = (existing.sum[ak] || 0) + (Number(item[ak]) || 0);
        existing.count++;
      } else {
        const sum: Record<string, number> = {};
        for (const sk of sumKeys) sum[sk] = Number(item[sk]) || 0;
        for (const ak of avgKeys) sum[ak] = Number(item[ak]) || 0;
        map.set(k, { sum, count: 1, row: { ...item } });
      }
    }
  }

  return Array.from(map.values()).map(({ sum, count, row }) => {
    const result = { ...row } as Record<string, unknown>;
    for (const sk of sumKeys) result[sk] = sum[sk];
    for (const ak of avgKeys) result[ak] = Math.round((sum[ak] / count) * 10) / 10;
    return result as T;
  });
}

export function aggregateSubjects(
  subjects: AggregatedProgramData[],
  label: string = 'ALL',
): AggregatedProgramData {
  const enrollment = sumByKey<EnrollmentRecord>(
    subjects.map(s => s.enrollment || []), ['term', 'academicYear'], ['count']
  ).sort((a, b) => a.termOrder - b.termOrder);

  const successFall = sumByKey<SuccessRecord>(
    subjects.map(s => s.successFall || []), 'term', ['count'], ['successRate', 'completionRate']
  );

  const successSpring = sumByKey<SuccessRecord>(
    subjects.map(s => s.successSpring || []), 'term', ['count'], ['successRate', 'completionRate']
  );

  const successSummerWinter = sumByKey<SuccessRecord>(
    subjects.map(s => s.successSummerWinter || []), 'term', ['count'], ['successRate', 'completionRate']
  );

  const successByEthnicity = sumByKey<EthnicitySuccessRecord>(
    subjects.map(s => s.successByEthnicity || []), ['academicYear', 'ethnicity'], ['count'], ['successRate']
  );

  const demographics = sumByKey<DemographicRecord>(
    subjects.map(s => s.demographics || []), 'ethnicity', ['count']
  );
  const demoTotal = demographics.reduce((s, d) => s + d.count, 0);
  for (const d of demographics) d.pct = demoTotal > 0 ? Math.round((d.count / demoTotal) * 1000) / 10 : 0;

  const gender = sumByKey<GenderRecord>(
    subjects.map(s => s.gender || []), ['academicYear', 'gender'], ['count']
  );

  const ageGroups = sumByKey<AgeGroupRecord>(
    subjects.map(s => s.ageGroups || []), ['academicYear', 'ageGroup'], ['count']
  );

  const modality = sumByKey<ModalityRecord>(
    subjects.map(s => s.modality || []), ['academicYear', 'modeGroup'], ['count'], ['successRate']
  );

  const retention = sumByKey<RetentionRecord>(
    subjects.map(s => s.retention || []), ['cohortTerm', 'termIndex'], ['count']
  );

  const highSchools = sumByKey<HighSchoolRecord>(
    subjects.map(s => s.highSchools || []), 'school', ['count']
  );
  const hsTotal = highSchools.reduce((s, h) => s + h.count, 0);
  for (const h of highSchools) h.pct = hsTotal > 0 ? Math.round((h.count / hsTotal) * 1000) / 10 : 0;
  highSchools.sort((a, b) => b.count - a.count);

  const ftes = sumByKey<FTESRecord>(
    subjects.map(s => s.ftes || []), 'academicYear', ['ftes']
  ).sort((a, b) => a.academicYear.localeCompare(b.academicYear));

  const location = sumByKey<LocationRecord>(
    subjects.map(s => s.location || []), 'location', ['count']
  );
  const locTotal = location.reduce((s, l) => s + l.count, 0);
  for (const l of location) l.pct = locTotal > 0 ? Math.round((l.count / locTotal) * 1000) / 10 : 0;

  const degreeApplicableCourses = sumByKey<CourseRecord>(
    subjects.map(s => s.degreeApplicableCourses || []), ['courseNumber', 'title'], ['count'], ['withdrawalRate']
  ).sort((a, b) => b.count - a.count);

  const notDegreeApplicableCourses = sumByKey<CourseRecord>(
    subjects.map(s => s.notDegreeApplicableCourses || []), ['courseNumber', 'title'], ['count'], ['withdrawalRate']
  ).sort((a, b) => b.count - a.count);

  return {
    subject: label,
    fetchedAt: new Date().toISOString(),
    enrollment,
    successFall,
    successSpring,
    successSummerWinter,
    successByEthnicity,
    demographics,
    gender,
    ageGroups,
    modality,
    retention,
    highSchools,
    ftes,
    degreeApplicableCourses,
    notDegreeApplicableCourses,
    location,
  };
}
