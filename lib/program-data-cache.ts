/**
 * Program Data Cache
 * Stores and retrieves cached program data from Supabase
 * Data persists until manually re-scraped — no expiration
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { AggregatedProgramData, FTESRecord } from './types';

/**
 * Save aggregated program data to cache
 */
export async function saveProgramDataCache(
  subject: string,
  data: AggregatedProgramData
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('program_data_cache')
    .upsert(
      {
        subject_code: subject,
        data: data,
        cached_at: new Date().toISOString(),
      },
      { onConflict: 'subject_code' }
    );

  if (error) {
    throw new Error(`Failed to cache program data: ${error.message}`);
  }
}

/**
 * Retrieve cached program data (no expiration check)
 */
export async function getCachedProgramData(subject: string): Promise<AggregatedProgramData | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('program_data_cache')
    .select('data')
    .eq('subject_code', subject)
    .single();

  if (error || !data) {
    return null;
  }

  return data.data as AggregatedProgramData;
}

/**
 * Get all cached subjects
 */
export async function getAllCachedSubjects(): Promise<
  Array<{ subject: string; cachedAt: string }>
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('program_data_cache')
    .select('subject_code, cached_at')
    .order('cached_at', { ascending: false });

  if (error) {
    return [];
  }

  return (
    data?.map(row => ({
      subject: row.subject_code,
      cachedAt: row.cached_at,
    })) || []
  );
}

/**
 * Get Banner FTES overrides for a subject
 */
export async function getFTESOverrides(subject: string): Promise<FTESRecord[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('ftes_override')
    .select('academic_year, ftes')
    .eq('subject_code', subject.toUpperCase())
    .order('academic_year');

  if (error || !data || data.length === 0) {
    return [];
  }

  return data.map(row => ({
    academicYear: row.academic_year,
    ftes: row.ftes,
  }));
}
