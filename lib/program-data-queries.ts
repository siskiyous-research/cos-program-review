/**
 * Program Data Queries
 * Ports Python query functions to TypeScript/mssql
 * Queries pvc_StudentClasses view from Zogotech SQL Server
 * All queries run in parallel for performance
 */

import { runQuery } from './zogotech-db';
import {
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
  AggregatedProgramData,
} from './types';

interface QueryParams {
  subject: string;
  yearsAgo?: number;
}

/**
 * Enrollment trend by term and academic year
 */
async function fetchEnrollment(subject: string, yearsAgo: number): Promise<EnrollmentRecord[]> {
  const query = `
    SELECT
      CAST(Term AS VARCHAR) AS term,
      CAST(TermOrder AS INT) AS termOrder,
      CAST(AcademicYear AS VARCHAR) AS academicYear,
      COUNT(*) AS count
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
    GROUP BY Term, TermOrder, AcademicYear
    ORDER BY TermOrder DESC
  `;
  const results = await runQuery(query, { subject, yearsAgo });
  return results;
}

/**
 * Success rates for a specific semester (Fall, Spring, Summer/Winter)
 */
async function fetchSuccessRates(
  subject: string,
  yearsAgo: number,
  semester: 'Fall' | 'Spring' | 'Summer/Winter'
): Promise<SuccessRecord[]> {
  const query = `
    SELECT
      CAST(Term AS VARCHAR) AS term,
      COUNT(*) AS count,
      CAST(ROUND(SUM(CASE WHEN Successful = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS FLOAT) AS successRate,
      CAST(ROUND(SUM(CASE WHEN Completed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS FLOAT) AS completionRate
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
      AND Semester = @semester
    GROUP BY Term
    ORDER BY Term DESC
  `;
  const results = await runQuery(query, { subject, yearsAgo, semester });
  return results;
}

/**
 * Success rates by ethnicity over time
 */
async function fetchSuccessByEthnicity(subject: string, yearsAgo: number): Promise<EthnicitySuccessRecord[]> {
  const query = `
    SELECT
      CAST(AcademicYear AS VARCHAR) AS academicYear,
      CAST(Ethnicity AS VARCHAR) AS ethnicity,
      COUNT(*) AS count,
      CAST(ROUND(SUM(CASE WHEN Successful = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS FLOAT) AS successRate
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
    GROUP BY AcademicYear, Ethnicity
    ORDER BY AcademicYear DESC, Ethnicity
  `;
  const results = await runQuery(query, { subject, yearsAgo });
  return results;
}

/**
 * Demographics by ethnicity (overall snapshot)
 */
async function fetchDemographics(subject: string, yearsAgo: number): Promise<DemographicRecord[]> {
  const query = `
    SELECT
      CAST(Ethnicity AS VARCHAR) AS ethnicity,
      COUNT(*) AS count,
      CAST(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM pvc_StudentClasses WHERE SubjectCode = @subject AND YearsAgo <= @yearsAgo), 1) AS FLOAT) AS pct
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
    GROUP BY Ethnicity
    ORDER BY count DESC
  `;
  const results = await runQuery(query, { subject, yearsAgo });
  return results;
}

/**
 * Gender distribution by academic year
 */
async function fetchGender(subject: string, yearsAgo: number): Promise<GenderRecord[]> {
  const query = `
    SELECT
      CAST(AcademicYear AS VARCHAR) AS academicYear,
      CAST(Gender AS VARCHAR) AS gender,
      COUNT(*) AS count
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
      AND Gender IS NOT NULL
    GROUP BY AcademicYear, Gender
    ORDER BY AcademicYear DESC, Gender
  `;
  const results = await runQuery(query, { subject, yearsAgo });
  return results;
}

/**
 * Age group distribution by academic year
 */
async function fetchAgeGroups(subject: string, yearsAgo: number): Promise<AgeGroupRecord[]> {
  const query = `
    SELECT
      CAST(AcademicYear AS VARCHAR) AS academicYear,
      CAST(CASE
        WHEN Age < 20 THEN 'Under 20'
        WHEN Age BETWEEN 20 AND 24 THEN '20-24'
        WHEN Age BETWEEN 25 AND 29 THEN '25-29'
        WHEN Age BETWEEN 30 AND 39 THEN '30-39'
        WHEN Age BETWEEN 40 AND 49 THEN '40-49'
        ELSE '50+'
      END AS VARCHAR) AS ageGroup,
      COUNT(*) AS count
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
      AND Age IS NOT NULL
    GROUP BY AcademicYear, CASE
      WHEN Age < 20 THEN 'Under 20'
      WHEN Age BETWEEN 20 AND 24 THEN '20-24'
      WHEN Age BETWEEN 25 AND 29 THEN '25-29'
      WHEN Age BETWEEN 30 AND 39 THEN '30-39'
      WHEN Age BETWEEN 40 AND 49 THEN '40-49'
      ELSE '50+'
    END
    ORDER BY AcademicYear DESC, ageGroup
  `;
  const results = await runQuery(query, { subject, yearsAgo });
  return results;
}

/**
 * Modality (Distance Ed vs In-Person) with success rates
 */
async function fetchModality(subject: string, yearsAgo: number): Promise<ModalityRecord[]> {
  const query = `
    SELECT
      CAST(AcademicYear AS VARCHAR) AS academicYear,
      CAST(CASE WHEN OnlineIndicator = 1 THEN 'Distance Ed' ELSE 'In-Person' END AS VARCHAR) AS modeGroup,
      COUNT(*) AS count,
      CAST(ROUND(SUM(CASE WHEN Successful = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS FLOAT) AS successRate
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
    GROUP BY AcademicYear, OnlineIndicator
    ORDER BY AcademicYear DESC, modeGroup
  `;
  const results = await runQuery(query, { subject, yearsAgo });
  return results;
}

/**
 * Retention: Year 1 vs Year 2 cohorts
 */
async function fetchRetention(subject: string, yearsAgo: number): Promise<RetentionRecord[]> {
  const query = `
    SELECT
      CAST(CohortTerm AS VARCHAR) AS cohortTerm,
      CAST(TermIndex AS INT) AS termIndex,
      COUNT(DISTINCT StudentId) AS count
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
      AND CohortTerm IS NOT NULL
    GROUP BY CohortTerm, TermIndex
    ORDER BY CohortTerm DESC, TermIndex
  `;
  const results = await runQuery(query, { subject, yearsAgo });
  return results;
}

/**
 * Top high schools by enrollment
 */
async function fetchHighSchools(subject: string, yearsAgo: number, topN: number = 20): Promise<HighSchoolRecord[]> {
  const query = `
    SELECT TOP @topN
      CAST(HighSchool AS VARCHAR) AS school,
      COUNT(*) AS count,
      CAST(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM pvc_StudentClasses WHERE SubjectCode = @subject AND YearsAgo <= @yearsAgo), 1) AS FLOAT) AS pct
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
      AND HighSchool IS NOT NULL
    GROUP BY HighSchool
    ORDER BY count DESC
  `;
  const results = await runQuery(query, { subject, yearsAgo, topN });
  return results;
}

/**
 * FTES (Full-Time Equivalent Students) by academic year
 */
async function fetchFTES(subject: string, yearsAgo: number): Promise<FTESRecord[]> {
  const query = `
    SELECT
      CAST(AcademicYear AS VARCHAR) AS academicYear,
      CAST(ROUND(SUM(FTES), 2) AS FLOAT) AS ftes
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
    GROUP BY AcademicYear
    ORDER BY AcademicYear DESC
  `;
  const results = await runQuery(query, { subject, yearsAgo });
  return results;
}

/**
 * Course list with withdrawal rates
 */
async function fetchCourseList(subject: string, yearsAgo: number, degreeApplicable: boolean): Promise<CourseRecord[]> {
  const query = `
    SELECT
      CAST(CourseNumber AS VARCHAR) AS courseNumber,
      CAST(Title AS VARCHAR) AS title,
      COUNT(*) AS count,
      CAST(ROUND(SUM(CASE WHEN Withdrawn = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS FLOAT) AS withdrawalRate
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
      AND DegreeApplicable = @degreeApplicable
    GROUP BY CourseNumber, Title
    ORDER BY count DESC
  `;
  const results = await runQuery(query, { subject, yearsAgo, degreeApplicable: degreeApplicable ? 1 : 0 });
  return results;
}

/**
 * Location (campus or online indicator)
 */
async function fetchLocation(subject: string, yearsAgo: number): Promise<LocationRecord[]> {
  const query = `
    SELECT
      CAST(Location AS VARCHAR) AS location,
      COUNT(*) AS count,
      CAST(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM pvc_StudentClasses WHERE SubjectCode = @subject AND YearsAgo <= @yearsAgo), 1) AS FLOAT) AS pct
    FROM pvc_StudentClasses
    WHERE SubjectCode = @subject
      AND YearsAgo <= @yearsAgo
      AND Location IS NOT NULL
    GROUP BY Location
    ORDER BY count DESC
  `;
  const results = await runQuery(query, { subject, yearsAgo });
  return results;
}

/**
 * Fetch all program data in parallel
 */
export async function fetchProgramData(params: QueryParams): Promise<AggregatedProgramData> {
  const { subject, yearsAgo = 4 } = params;

  try {
    const [
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
    ] = await Promise.all([
      fetchEnrollment(subject, yearsAgo),
      fetchSuccessRates(subject, yearsAgo, 'Fall'),
      fetchSuccessRates(subject, yearsAgo, 'Spring'),
      fetchSuccessRates(subject, yearsAgo, 'Summer/Winter'),
      fetchSuccessByEthnicity(subject, yearsAgo),
      fetchDemographics(subject, yearsAgo),
      fetchGender(subject, yearsAgo),
      fetchAgeGroups(subject, yearsAgo),
      fetchModality(subject, yearsAgo),
      fetchRetention(subject, yearsAgo),
      fetchHighSchools(subject, yearsAgo, 20),
      fetchFTES(subject, yearsAgo),
      fetchCourseList(subject, yearsAgo, true),
      fetchCourseList(subject, yearsAgo, false),
      fetchLocation(subject, yearsAgo),
    ]);

    return {
      subject,
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
  } catch (error) {
    console.error('Failed to fetch program data:', error);
    throw error;
  }
}
