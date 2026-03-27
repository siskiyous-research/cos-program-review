-- SLO Tracking Schema
-- Mirrors tracking-schema.sql patterns for SLO assessment lifecycle tracking

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Course list: which courses need SLO tracking (uploaded by admin via CSV)
CREATE TABLE IF NOT EXISTS slo_course_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_subject text NOT NULL,        -- e.g., 'MATH'
  course_number text NOT NULL,         -- e.g., '101'
  course_title text,                   -- e.g., 'College Algebra'
  program_name text NOT NULL,          -- parent program, e.g., 'Math'
  division text NOT NULL,              -- 'CTE', 'LAS', etc.
  faculty_name text,                   -- instructor name for follow-up
  faculty_id text,                     -- instructor ID
  academic_year text NOT NULL,         -- e.g., '2025-2026'
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_subject, course_number, academic_year)
);

-- Course tracking: 4-stage SLO lifecycle per course
CREATE TABLE IF NOT EXISTS slo_course_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_subject text NOT NULL,
  course_number text NOT NULL,
  program_name text NOT NULL,
  academic_year text NOT NULL,
  slo_defined boolean DEFAULT false,
  slo_assessed boolean DEFAULT false,
  results_analyzed boolean DEFAULT false,
  improvements_made boolean DEFAULT false,
  status_override text,                -- NULL = auto-computed
  notes text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(course_subject, course_number, academic_year)
);

-- Engagement log for SLO follow-up activities
CREATE TABLE IF NOT EXISTS slo_engagement_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_subject text NOT NULL,
  course_number text NOT NULL,
  program_name text NOT NULL,
  academic_year text NOT NULL,
  engagement_type text NOT NULL,       -- 'meeting'|'email'|'reminder'|'training'|'data_review'|'assessment_submitted'|'other'
  notes text,
  engagement_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- SLO assessment data (Phase 2: populated from eLumen CSV uploads)
CREATE TABLE IF NOT EXISTS slo_assessment_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,            -- anonymized
  ethnicity text,
  age_group text,
  gender text,
  course_subject text NOT NULL,
  course_number text NOT NULL,
  crn text,
  faculty_id text,
  faculty_name text,
  slo_description text NOT NULL,
  mastery_achieved boolean,
  mastery_level text,                  -- 'Does not meet'|'Meets Expectations'|'Exceeds Expectations'|'NA'
  scores numeric,
  possible numeric,
  percent_score numeric,
  academic_year text NOT NULL,
  term text,                           -- 'Fall 2025', 'Spring 2026'
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slo_course_list_year
  ON slo_course_list(academic_year);

CREATE INDEX IF NOT EXISTS idx_slo_course_list_subject_year
  ON slo_course_list(course_subject, course_number, academic_year);

CREATE INDEX IF NOT EXISTS idx_slo_course_list_program
  ON slo_course_list(program_name, academic_year);

CREATE INDEX IF NOT EXISTS idx_slo_tracking_subject_year
  ON slo_course_tracking(course_subject, course_number, academic_year);

CREATE INDEX IF NOT EXISTS idx_slo_tracking_year
  ON slo_course_tracking(academic_year);

CREATE INDEX IF NOT EXISTS idx_slo_engagement_subject_year
  ON slo_engagement_log(course_subject, course_number, academic_year);

CREATE INDEX IF NOT EXISTS idx_slo_engagement_date
  ON slo_engagement_log(engagement_date DESC);

CREATE INDEX IF NOT EXISTS idx_slo_assessment_subject_year
  ON slo_assessment_data(course_subject, course_number, academic_year);

CREATE INDEX IF NOT EXISTS idx_slo_assessment_year
  ON slo_assessment_data(academic_year);

CREATE INDEX IF NOT EXISTS idx_slo_assessment_slo
  ON slo_assessment_data(slo_description);

-- RLS
ALTER TABLE slo_course_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE slo_course_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE slo_engagement_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE slo_assessment_data ENABLE ROW LEVEL SECURITY;

-- slo_course_list policies
CREATE POLICY "Enable read for authenticated" ON slo_course_list
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON slo_course_list
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON slo_course_list
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON slo_course_list
  FOR DELETE USING (auth.role() = 'authenticated');

-- slo_course_tracking policies
CREATE POLICY "Enable read for authenticated" ON slo_course_tracking
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON slo_course_tracking
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated" ON slo_course_tracking
  FOR UPDATE USING (auth.role() = 'authenticated');

-- slo_engagement_log policies
CREATE POLICY "Enable read for authenticated" ON slo_engagement_log
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON slo_engagement_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for owners" ON slo_engagement_log
  FOR DELETE USING (created_by = auth.uid() OR auth.role() = 'authenticated');

-- slo_assessment_data policies
CREATE POLICY "Enable read for authenticated" ON slo_assessment_data
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated" ON slo_assessment_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated" ON slo_assessment_data
  FOR DELETE USING (auth.role() = 'authenticated');
