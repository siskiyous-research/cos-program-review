/**
 * Program Data Queries
 * Ports Python query functions to TypeScript/mssql
 * Queries pvc_StudentClasses view from Zogotech SQL Server
 * Column names match the actual view exactly (from working Python dashboard)
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
 * Build base WHERE clause matching Python's build_where()
 * credit_only=true uses Academic Level = 'Credit' only (for success rate queries)
 */
function baseWhere(creditOnly = false): string {
  if (creditOnly) {
    return "[Academic Level] = 'Credit' AND Enrolled = 'Yes'";
  }
  return "[Academic Level] IN ('Credit', 'Non Credit') AND Enrolled = 'Yes'";
}

/**
 * Enrollment trend by term and academic year
 */
async function fetchEnrollment(subject: string, yearsAgo: number): Promise<EnrollmentRecord[]> {
  const results = await runQuery(`
    SELECT
      [Term] AS term,
      [Term Order] AS termOrder,
      [Academic Year] AS academicYear,
      COUNT(*) AS count
    FROM pvc_StudentClasses
    WHERE ${baseWhere()}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
    GROUP BY [Term], [Term Order], [Academic Year]
    ORDER BY [Term Order]
  `, { subject, yearsAgo });
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
  let semesterClause: string;
  if (semester === 'Summer/Winter') {
    semesterClause = "AND [Semester] IN ('Summer', 'Winter')";
  } else {
    semesterClause = `AND [Semester] = @semester`;
  }

  const params: Record<string, any> = { subject, yearsAgo };
  if (semester !== 'Summer/Winter') {
    params.semester = semester;
  }

  const results = await runQuery(`
    SELECT
      [Term] AS term,
      COUNT(*) AS count,
      CAST(ROUND(SUM(CAST([Total Successes] AS FLOAT)) * 100.0 / COUNT(*), 1) AS FLOAT) AS successRate,
      CAST(ROUND(SUM(CAST([Total Completions] AS FLOAT)) * 100.0 / COUNT(*), 1) AS FLOAT) AS completionRate
    FROM pvc_StudentClasses
    WHERE ${baseWhere(true)}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
      ${semesterClause}
    GROUP BY [Term], [Term Order]
    ORDER BY [Term Order]
  `, params);
  return results;
}

/**
 * Success rates by ethnicity over time
 */
async function fetchSuccessByEthnicity(subject: string, yearsAgo: number): Promise<EthnicitySuccessRecord[]> {
  const results = await runQuery(`
    SELECT
      [Academic Year] AS academicYear,
      [Ethnicity] AS ethnicity,
      COUNT(*) AS count,
      CAST(ROUND(SUM(CAST([Total Successes] AS FLOAT)) * 100.0 / COUNT(*), 1) AS FLOAT) AS successRate
    FROM pvc_StudentClasses
    WHERE ${baseWhere(true)}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
    GROUP BY [Academic Year], [Ethnicity]
    ORDER BY [Academic Year], [Ethnicity]
  `, { subject, yearsAgo });
  return results;
}

/**
 * Demographics by ethnicity (unique students)
 */
async function fetchDemographics(subject: string, yearsAgo: number): Promise<DemographicRecord[]> {
  const results = await runQuery(`
    SELECT
      [Ethnicity] AS ethnicity,
      COUNT(DISTINCT [Student Surrogate Key]) AS count,
      CAST(ROUND(
        COUNT(DISTINCT [Student Surrogate Key]) * 100.0 /
        (SELECT COUNT(DISTINCT [Student Surrogate Key]) FROM pvc_StudentClasses
         WHERE ${baseWhere()} AND Subject = @subject AND [Academic Years Ago] <= @yearsAgo),
      1) AS FLOAT) AS pct
    FROM pvc_StudentClasses
    WHERE ${baseWhere()}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
    GROUP BY [Ethnicity]
    ORDER BY count DESC
  `, { subject, yearsAgo });
  return results;
}

/**
 * Gender distribution by academic year (unique students)
 */
async function fetchGender(subject: string, yearsAgo: number): Promise<GenderRecord[]> {
  const results = await runQuery(`
    SELECT
      [Academic Year] AS academicYear,
      [Gender] AS gender,
      COUNT(DISTINCT [Student Surrogate Key]) AS count
    FROM pvc_StudentClasses
    WHERE ${baseWhere()}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
    GROUP BY [Academic Year], [Gender]
    ORDER BY [Academic Year], [Gender]
  `, { subject, yearsAgo });
  return results;
}

/**
 * Age group distribution by academic year
 */
async function fetchAgeGroups(subject: string, yearsAgo: number): Promise<AgeGroupRecord[]> {
  const results = await runQuery(`
    SELECT
      [Academic Year] AS academicYear,
      [Age Group] AS ageGroup,
      COUNT(*) AS count
    FROM pvc_StudentClasses
    WHERE ${baseWhere()}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
    GROUP BY [Academic Year], [Age Group]
    ORDER BY [Academic Year]
  `, { subject, yearsAgo });
  return results;
}

/**
 * Modality (Distance Ed vs In-Person) with success rates
 */
async function fetchModality(subject: string, yearsAgo: number): Promise<ModalityRecord[]> {
  const results = await runQuery(`
    SELECT
      [Academic Year] AS academicYear,
      CASE WHEN [Instructional Mode] LIKE '%Internet%'
           OR [Instructional Mode] LIKE '%Dist%'
        THEN 'Distance Ed' ELSE 'In-Person' END AS modeGroup,
      COUNT(*) AS count,
      CAST(ROUND(SUM(CAST([Total Successes] AS FLOAT)) * 100.0 / COUNT(*), 1) AS FLOAT) AS successRate
    FROM pvc_StudentClasses
    WHERE ${baseWhere(true)}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
    GROUP BY [Academic Year],
      CASE WHEN [Instructional Mode] LIKE '%Internet%'
           OR [Instructional Mode] LIKE '%Dist%'
        THEN 'Distance Ed' ELSE 'In-Person' END
    ORDER BY [Academic Year]
  `, { subject, yearsAgo });
  return results;
}

/**
 * Retention: Year 1 vs Year 2 cohorts
 */
async function fetchRetention(subject: string, yearsAgo: number): Promise<RetentionRecord[]> {
  const results = await runQuery(`
    SELECT
      [Starting Cohort Term] AS cohortTerm,
      [Term Index] AS termIndex,
      COUNT(DISTINCT [Student Surrogate Key]) AS count
    FROM pvc_StudentClasses
    WHERE ${baseWhere()}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
      AND [Term Index] IN ('Year 1, Term 1', 'Year 2, Term 1')
    GROUP BY [Starting Cohort Term], [Starting Cohort Term Order], [Term Index]
    ORDER BY [Starting Cohort Term Order], [Term Index]
  `, { subject, yearsAgo });
  return results;
}

/**
 * Top high schools by enrollment (unique students)
 */
async function fetchHighSchools(subject: string, yearsAgo: number, topN: number = 20): Promise<HighSchoolRecord[]> {
  const results = await runQuery(`
    SELECT TOP ${topN}
      [High School Name] AS school,
      COUNT(DISTINCT [Student Surrogate Key]) AS count,
      CAST(ROUND(
        COUNT(DISTINCT [Student Surrogate Key]) * 100.0 /
        (SELECT COUNT(DISTINCT [Student Surrogate Key]) FROM pvc_StudentClasses
         WHERE ${baseWhere()} AND Subject = @subject AND [Academic Years Ago] <= @yearsAgo),
      1) AS FLOAT) AS pct
    FROM pvc_StudentClasses
    WHERE ${baseWhere()}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
      AND [High School Name] IS NOT NULL
      AND [High School Name] != ''
      AND [High School Name] != '(Blank)'
    GROUP BY [High School Name]
    ORDER BY count DESC
  `, { subject, yearsAgo });
  return results;
}

/**
 * FTES (Full-Time Equivalent Students) by academic year
 */
async function fetchFTES(subject: string, yearsAgo: number): Promise<FTESRecord[]> {
  const results = await runQuery(`
    SELECT
      [Academic Year] AS academicYear,
      CAST(ROUND(SUM([FTE EST]), 2) AS FLOAT) AS ftes
    FROM pvc_StudentClasses
    WHERE ${baseWhere()}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
    GROUP BY [Academic Year]
    ORDER BY [Academic Year]
  `, { subject, yearsAgo });
  return results;
}

/**
 * Course list with withdrawal rates
 */
async function fetchCourseList(subject: string, yearsAgo: number, degreeApplicable: boolean): Promise<CourseRecord[]> {
  const daFilter = degreeApplicable ? "'Y'" : "'N'";
  const results = await runQuery(`
    SELECT
      [Subject and Course Number] AS courseNumber,
      [Course Title] AS title,
      COUNT(*) AS count,
      CAST(ROUND(SUM(CAST([Total Withdrawals] AS FLOAT)) * 100.0 / COUNT(*), 1) AS FLOAT) AS withdrawalRate
    FROM pvc_StudentClasses
    WHERE ${baseWhere()}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
      AND [Degree Applicable Course] = ${daFilter}
    GROUP BY [Subject and Course Number], [Course Title]
    ORDER BY [Subject and Course Number], [Course Title]
  `, { subject, yearsAgo });
  return results;
}

/**
 * Location / campus code (unique students)
 */
async function fetchLocation(subject: string, yearsAgo: number): Promise<LocationRecord[]> {
  const results = await runQuery(`
    SELECT
      [Location] AS location,
      COUNT(DISTINCT [Student Surrogate Key]) AS count,
      CAST(ROUND(
        COUNT(DISTINCT [Student Surrogate Key]) * 100.0 /
        (SELECT COUNT(DISTINCT [Student Surrogate Key]) FROM pvc_StudentClasses
         WHERE ${baseWhere()} AND Subject = @subject AND [Academic Years Ago] <= @yearsAgo),
      1) AS FLOAT) AS pct
    FROM pvc_StudentClasses
    WHERE ${baseWhere()}
      AND Subject = @subject
      AND [Academic Years Ago] <= @yearsAgo
    GROUP BY [Location]
    ORDER BY count DESC
  `, { subject, yearsAgo });
  return results;
}

/**
 * Fetch all program data in parallel
 */
export async function fetchProgramData(params: QueryParams): Promise<AggregatedProgramData> {
  const { subject, yearsAgo = 4 } = params;

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
}
