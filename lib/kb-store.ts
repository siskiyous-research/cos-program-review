/**
 * Server-side KB file storage via Supabase
 * Uses pr_kb_files table instead of local filesystem
 */

import { createClient } from '@/lib/supabase/server';

export interface KBUploadEntry {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  program: string;
  uploadedAt: string;
  textPreview: string;
  textLength: number;
}

export async function listUploads(program?: string): Promise<KBUploadEntry[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('pr_kb_files')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (program) {
    query = query.eq('program_name', program);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    filename: row.file_name,
    fileType: row.file_type || '',
    fileSize: row.file_size || 0,
    program: row.program_name,
    uploadedAt: row.created_at,
    textPreview: (row.text_content || '').slice(0, 200),
    textLength: (row.text_content || '').length,
  }));
}

export async function getUploadText(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('pr_kb_files')
    .select('text_content')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return data.text_content;
}

export async function addUpload(entry: KBUploadEntry, text: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('pr_kb_files')
    .insert({
      user_id: user.id,
      program_name: entry.program,
      file_name: entry.filename,
      file_type: entry.fileType,
      file_size: entry.fileSize,
      text_content: text,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Failed to save KB file:', error);
    return null;
  }

  return data.id;
}

export async function deleteUpload(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('pr_kb_files')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}

export async function updateUpload(id: string, changes: Partial<Pick<KBUploadEntry, 'program'>>): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const update: Record<string, string> = {};
  if (changes.program !== undefined) update.program_name = changes.program;

  const { error } = await supabase
    .from('pr_kb_files')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
}
