/**
 * Server-side KB file storage
 * Stores upload metadata in data/kb-uploads/manifest.json
 * and extracted text in data/kb-uploads/texts/{id}.txt
 */

import fs from 'fs';
import path from 'path';

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

const KB_DIR = path.join(process.cwd(), 'data', 'kb-uploads');
const MANIFEST_PATH = path.join(KB_DIR, 'manifest.json');
const TEXTS_DIR = path.join(KB_DIR, 'texts');

function ensureDirs() {
  if (!fs.existsSync(KB_DIR)) fs.mkdirSync(KB_DIR, { recursive: true });
  if (!fs.existsSync(TEXTS_DIR)) fs.mkdirSync(TEXTS_DIR, { recursive: true });
}

function readManifest(): KBUploadEntry[] {
  ensureDirs();
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  return JSON.parse(raw) as KBUploadEntry[];
}

function writeManifest(entries: KBUploadEntry[]) {
  ensureDirs();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2));
}

export function listUploads(program?: string): KBUploadEntry[] {
  const entries = readManifest();
  if (program) return entries.filter(e => e.program === program);
  return entries;
}

export function getUploadText(id: string): string | null {
  const textPath = path.join(TEXTS_DIR, `${id}.txt`);
  if (!fs.existsSync(textPath)) return null;
  return fs.readFileSync(textPath, 'utf-8');
}

export function addUpload(entry: KBUploadEntry, text: string) {
  ensureDirs();
  const entries = readManifest();
  entries.push(entry);
  writeManifest(entries);
  fs.writeFileSync(path.join(TEXTS_DIR, `${entry.id}.txt`), text);
}

export function deleteUpload(id: string): boolean {
  const entries = readManifest();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return false;
  entries.splice(idx, 1);
  writeManifest(entries);
  const textPath = path.join(TEXTS_DIR, `${id}.txt`);
  if (fs.existsSync(textPath)) fs.unlinkSync(textPath);
  return true;
}

export function updateUpload(id: string, changes: Partial<Pick<KBUploadEntry, 'program'>>): boolean {
  const entries = readManifest();
  const entry = entries.find(e => e.id === id);
  if (!entry) return false;
  if (changes.program !== undefined) entry.program = changes.program;
  writeManifest(entries);
  return true;
}
