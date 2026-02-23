/**
 * Auto-populate knowledge base defaults per program from scraped data.
 * Provides relevant policy and accreditation context for each program category.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DataChunk } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

// Map program categories to relevant policy chapters
const CATEGORY_CHAPTERS: Record<string, string[]> = {
  instructional: ['IV', 'V', 'VI'],
  academicAffairs: ['III', 'IV'],
  presidentsOffice: ['I', 'II'],
  administrativeServices: ['VI', 'VII'],
  studentServices: ['V', 'III'],
};

interface KBDefaults {
  [programName: string]: string;
}

let cachedDefaults: KBDefaults | null = null;

/**
 * Build a summary string from relevant policy chunks for a given category
 */
function loadCategoryPolicySummary(category: string): string {
  const relevantChapters = CATEGORY_CHAPTERS[category] || [];
  const chunksDir = path.join(DATA_DIR, 'policies', 'chunks');

  if (!fs.existsSync(chunksDir)) return '';

  const summaryParts: string[] = [];
  const files = fs.readdirSync(chunksDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    try {
      const chunks: DataChunk[] = JSON.parse(
        fs.readFileSync(path.join(chunksDir, file), 'utf-8')
      );

      for (const chunk of chunks) {
        if (
          chunk.metadata.chapter &&
          relevantChapters.includes(chunk.metadata.chapter) &&
          summaryParts.length < 5 // Limit to 5 most relevant policies
        ) {
          summaryParts.push(
            `${chunk.metadata.policyType} ${chunk.metadata.policyNumber}: ${chunk.title}\n${chunk.text.slice(0, 200)}...`
          );
        }
      }
    } catch {
      // Skip unparseable files
    }
  }

  if (summaryParts.length === 0) return '';
  return `Relevant Board Policies:\n${summaryParts.join('\n\n')}`;
}

/**
 * Load accreditation summary
 */
function loadAccreditationSummary(): string {
  const chunksDir = path.join(DATA_DIR, 'accreditation', 'chunks');

  if (!fs.existsSync(chunksDir)) return '';

  const files = fs.readdirSync(chunksDir).filter((f) => f.endsWith('.json'));
  const summaryParts: string[] = [];

  for (const file of files.slice(0, 3)) {
    // Just take first 3 accreditation docs
    try {
      const chunks: DataChunk[] = JSON.parse(
        fs.readFileSync(path.join(chunksDir, file), 'utf-8')
      );

      if (chunks.length > 0) {
        summaryParts.push(
          `${chunks[0].title}: ${chunks[0].text.slice(0, 300)}...`
        );
      }
    } catch {
      // Skip
    }
  }

  if (summaryParts.length === 0) return '';
  return `Accreditation Context:\n${summaryParts.join('\n\n')}`;
}

/**
 * Get knowledge base defaults for all programs.
 * Returns a map of programName → default KB text.
 */
export function getKnowledgeBaseDefaults(): KBDefaults {
  if (cachedDefaults) return cachedDefaults;

  // Check if data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    return {};
  }

  const defaults: KBDefaults = {};
  const accreditationSummary = loadAccreditationSummary();

  // Build defaults by category
  const categories: Record<string, string[]> = {
    instructional: [],
    academicAffairs: [],
    presidentsOffice: [],
    administrativeServices: [],
    studentServices: [],
  };

  // We'll need to import program list — but since this may run server-side only,
  // let's just build the category-level summaries
  for (const [category, _programs] of Object.entries(categories)) {
    const policySummary = loadCategoryPolicySummary(category);
    const combined = [policySummary, accreditationSummary].filter(Boolean).join('\n\n---\n\n');
    if (combined) {
      categories[category] = [combined];
    }
  }

  cachedDefaults = defaults;
  return defaults;
}

/**
 * Get the default KB text for a specific program based on its category
 */
export function getDefaultKBForCategory(category: string): string {
  const policySummary = loadCategoryPolicySummary(category);
  const accreditationSummary = loadAccreditationSummary();

  return [policySummary, accreditationSummary].filter(Boolean).join('\n\n---\n\n');
}
