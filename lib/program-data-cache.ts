/**
 * Program Data Cache
 * Stores and retrieves cached program data from Supabase
 * Allows periodic scraping to keep data fresh locally
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { AggregatedProgramData } from './types';

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
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: 'subject_code' }
    );

  if (error) {
    throw new Error(`Failed to cache program data: ${error.message}`);
  }
}

/**
 * Retrieve cached program data
 */
export async function getCachedProgramData(subject: string): Promise<AggregatedProgramData | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('program_data_cache')
    .select('data')
    .eq('subject_code', subject)
    .gt('expires_at', new Date().toISOString())
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
  Array<{ subject: string; cachedAt: string; expiresAt: string }>
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('program_data_cache')
    .select('subject_code, cached_at, expires_at')
    .order('cached_at', { ascending: false });

  if (error) {
    return [];
  }

  return (
    data?.map(row => ({
      subject: row.subject_code,
      cachedAt: row.cached_at,
      expiresAt: row.expires_at,
    })) || []
  );
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('program_data_cache')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Failed to clear expired cache:', error.message);
  }
}
