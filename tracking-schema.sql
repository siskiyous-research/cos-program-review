-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Engagement log table for tracking activities
CREATE TABLE IF NOT EXISTS pr_engagement_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name text NOT NULL,
  program_type text NOT NULL,     -- 'instructional' | 'non_instructional'
  academic_year text NOT NULL,    -- e.g., '2025-2026'
  engagement_type text NOT NULL,  -- 'meeting' | 'email' | 'data_collection' | 'phone_call' | 'other'
  notes text,
  engagement_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Program tracking status table
CREATE TABLE IF NOT EXISTS pr_program_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name text NOT NULL,
  program_type text NOT NULL,     -- 'instructional' | 'non_instructional'
  academic_year text NOT NULL,
  draft_submitted boolean DEFAULT false,
  final_submitted boolean DEFAULT false,
  status_override text,           -- NULL = auto-computed; 'green'|'yellow'|'red' = manual
  notes text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(program_name, academic_year)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_engagement_log_program_year
  ON pr_engagement_log(program_name, academic_year);

CREATE INDEX IF NOT EXISTS idx_engagement_log_date
  ON pr_engagement_log(engagement_date DESC);

CREATE INDEX IF NOT EXISTS idx_program_tracking_year
  ON pr_program_tracking(academic_year);

CREATE INDEX IF NOT EXISTS idx_program_tracking_program_year
  ON pr_program_tracking(program_name, academic_year);

-- Set up RLS (Row Level Security) if needed
ALTER TABLE pr_engagement_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_program_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies: Allow authenticated users to read/write all data
CREATE POLICY "Enable read access for all authenticated users"
  ON pr_engagement_log FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for all authenticated users"
  ON pr_engagement_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for data owners"
  ON pr_engagement_log FOR DELETE
  USING (created_by = auth.uid() OR auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all authenticated users"
  ON pr_program_tracking FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for all authenticated users"
  ON pr_program_tracking FOR UPDATE
  USING (auth.role() = 'authenticated');
