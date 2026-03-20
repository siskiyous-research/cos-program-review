/**
 * RAG Service: Load search index and retrieve relevant data chunks
 * for injection into AI prompts.
 *
 * Runs server-side only. Loads data from the data/ directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DataChunk, SearchIndex, SearchIndexEntry, RAGContext, Citation, RAGContextWithCitations } from './types';
import { getMappedStandards } from './accjc-standards';

const DATA_DIR = path.join(process.cwd(), 'data');
const MAX_RAG_TOKENS = 2000;
const MIN_RELEVANCE_SCORE = 10;

// Cached search index (loaded once per server lifecycle)
let cachedIndex: SearchIndex | null = null;
// Cached chunks (loaded on demand)
const chunkCache = new Map<string, DataChunk[]>();

/**
 * Load the search index from disk
 */
function getSearchIndex(): SearchIndex | null {
  if (cachedIndex) return cachedIndex;

  const indexPath = path.join(DATA_DIR, 'search-index.json');
  if (!fs.existsSync(indexPath)) {
    console.warn('RAG: search-index.json not found. Run `npm run scrape` first.');
    return null;
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf-8');
    cachedIndex = JSON.parse(content) as SearchIndex;
    return cachedIndex;
  } catch (err) {
    console.error('RAG: Failed to load search index:', err);
    return null;
  }
}

/**
 * Load chunk data from a file path relative to data/
 */
function loadChunks(filePath: string): DataChunk[] {
  if (chunkCache.has(filePath)) {
    return chunkCache.get(filePath)!;
  }

  const fullPath = path.join(DATA_DIR, filePath);
  if (!fs.existsSync(fullPath)) return [];

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const parsed = JSON.parse(content);
    const chunks = Array.isArray(parsed) ? parsed : [parsed];
    chunkCache.set(filePath, chunks);
    return chunks;
  } catch {
    return [];
  }
}

// Section type → relevant policy chapters mapping
const SECTION_CHAPTER_MAP: Record<string, string[]> = {
  program_info: ['I', 'II'],
  program_description: ['I', 'III'],
  improvement_actions: ['IV', 'VII'],
  slo_assessment: ['IV'],
  support_obstacles: ['V', 'III'],
  budgetary_needs: ['VI'],
  closing_the_loop_annual: ['VI'],
  external_factors: ['III', 'IV'],
  outcomes_assessment: ['IV'],
  effectiveness_indicators: ['I', 'III'],
  other_research: ['I'],
  analysis: ['I', 'III', 'IV'],
  vision: ['I'],
  prior_goals: ['I'],
  action_plan: ['VI'],
  closing_loop: ['VI'],
  ni_program_description: ['I', 'III'],
  ni_external_factors: ['III'],
  ni_outcomes_assessment: ['IV'],
  ni_quantitative_qualitative_data: ['V'],
  ni_unit_specific_results: ['V'],
  ni_evaluation: ['I', 'III'],
  ni_prior_goals: ['I'],
  ni_closing_budget_loop: ['VI'],
  ni_vision: ['I'],
  ni_action_plan: ['VI'],
  ni_conclusion: ['I'],
};

interface RetrievalOptions {
  programName?: string;
  programCategory?: string;
  sectionId?: string;
  maxTokens?: number;
}

/**
 * Score an index entry based on relevance to the query
 * Reviews from other programs are excluded (score 0) to avoid irrelevant citations.
 */
function scoreEntry(entry: SearchIndexEntry, opts: RetrievalOptions): number {
  let score = 0;

  // For reviews: ONLY include if they match the current program exactly
  if (entry.source === 'review') {
    if (opts.programName && entry.metadata.program) {
      if (entry.metadata.program === opts.programName) {
        score += 100;
      } else {
        // Different program's review → exclude entirely
        return 0;
      }
    } else {
      // No program match possible → exclude
      return 0;
    }
    // Recency bonus for reviews
    if (entry.metadata.year) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - entry.metadata.year;
      if (age <= 2) score += 15;
      else if (age <= 4) score += 8;
    }
    score += 10;
    return score;
  }

  // Exclude policies — too noisy for program reviews
  if (entry.source === 'policy') return 0;

  // Accreditation docs: only include if section has a matching ACCJC standard
  if (entry.source === 'accreditation') {
    if (opts.sectionId) {
      const mappedStandards = getMappedStandards(opts.sectionId);
      for (const std of mappedStandards) {
        const stdTag = `accjc-${std.toLowerCase().replace('.', '')}`;
        if (entry.tags.includes(stdTag)) {
          return 15;
        }
      }
    }
    return 0;
  }

  return score;
}

/**
 * Retrieve relevant chunks for a given context
 */
export function retrieveContext(opts: RetrievalOptions): RAGContext {
  const index = getSearchIndex();
  if (!index || index.totalChunks === 0) {
    return { chunks: [], totalTokens: 0, sources: [] };
  }

  const maxTokens = opts.maxTokens || MAX_RAG_TOKENS;

  // Score all entries — filter out low-relevance chunks
  const scored = index.entries
    .map((entry) => ({ entry, score: scoreEntry(entry, opts) }))
    .filter((item) => item.score >= MIN_RELEVANCE_SCORE)
    .sort((a, b) => b.score - a.score);

  // Load chunks up to token budget
  const selectedChunks: DataChunk[] = [];
  const sources = new Set<string>();
  let totalTokens = 0;

  for (const { entry } of scored) {
    if (totalTokens >= maxTokens) break;

    const chunks = loadChunks(entry.filePath);
    for (const chunk of chunks) {
      if (chunk.id === entry.chunkId) {
        if (totalTokens + chunk.tokenCount <= maxTokens) {
          selectedChunks.push(chunk);
          totalTokens += chunk.tokenCount;
          sources.add(`${chunk.source}: ${chunk.title}`);
        }
        break;
      }
    }
  }

  return {
    chunks: selectedChunks,
    totalTokens,
    sources: Array.from(sources),
  };
}

/**
 * Format RAG context into a string for injection into AI prompts
 */
export function formatRAGContext(context: RAGContext): string {
  if (context.chunks.length === 0) return '';

  const sections: string[] = [];

  // Group by source type
  const bySource = new Map<string, DataChunk[]>();
  for (const chunk of context.chunks) {
    const key = chunk.source;
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key)!.push(chunk);
  }

  const sourceLabels: Record<string, string> = {
    policy: 'Board Policies & Administrative Procedures',
    review: 'Historical Program Reviews',
    accreditation: 'Accreditation Documents',
    meeting: 'Board Meeting Minutes',
  };

  for (const [source, chunks] of bySource) {
    const label = sourceLabels[source] || source;
    const chunkTexts = chunks
      .map((c) => `### ${c.title}\n${c.text}`)
      .join('\n\n');

    sections.push(`## ${label}\n\n${chunkTexts}`);
  }

  return `\n# Institutional Context (RAG Data)\nThe following is real institutional data from College of the Siskiyous. Use this to ground your response in actual COS context.\n\n${sections.join('\n\n---\n\n')}\n`;
}

// Cached reviews manifest for URL building
let cachedReviewManifest: Record<string, { program: string; category: string; files: { title: string; filename: string }[] }> | null = null;

function getReviewManifest() {
  if (cachedReviewManifest) return cachedReviewManifest;
  const manifestPath = path.join(process.cwd(), 'public', 'reviews', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    cachedReviewManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    return cachedReviewManifest;
  } catch {
    return null;
  }
}

/**
 * Build a source URL for a data chunk
 */
function buildSourceUrl(chunk: DataChunk): string | undefined {
  switch (chunk.source) {
    case 'policy': {
      // BoardDocs URL for board policies/admin procedures
      const num = chunk.metadata.policyNumber || '';
      const type = chunk.metadata.policyType === 'AP' ? 'AP' : 'BP';
      if (num) {
        return `https://go.boarddocs.com/ca/siskiyous/Board.nsf/Public#action=search&terms=${type}+${num}`;
      }
      return undefined;
    }
    case 'review': {
      // Look up actual file path from manifest using sourceId
      const manifest = getReviewManifest();
      if (manifest) {
        // The sourceId is a slug like "adhs-program-review-2018"
        // Search manifest entries for a matching filename
        for (const [key, entry] of Object.entries(manifest)) {
          const programSlug = key.split('/').pop() || '';
          for (const file of entry.files) {
            // Slugify the filename for comparison
            const fileSlug = file.filename
              .replace(/\.pdf$/i, '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            if (fileSlug === chunk.sourceId || chunk.sourceId.includes(fileSlug) || fileSlug.includes(chunk.sourceId)) {
              return `/reviews/${entry.category}/${programSlug}/${encodeURIComponent(file.filename)}`;
            }
          }
        }
      }
      // Fallback: no manifest match
      return undefined;
    }
    case 'accreditation':
      // Accreditation docs on the college site
      return `https://www.siskiyous.edu/accreditation/`;
    default:
      return undefined;
  }
}

/**
 * Format RAG context with numbered citations for AI prompts
 * Returns both the prompt text (with [1], [2] tags) and a citations array for the client
 */
export function formatRAGContextWithCitations(context: RAGContext): RAGContextWithCitations {
  if (context.chunks.length === 0) {
    return { promptText: '', citations: [] };
  }

  const citations: Citation[] = [];
  const numberedSections: string[] = [];

  context.chunks.forEach((chunk, index) => {
    const num = index + 1;
    const url = buildSourceUrl(chunk);
    citations.push({
      id: num,
      title: chunk.title,
      source: chunk.source,
      url,
    });
    numberedSections.push(`[${num}] ${chunk.title} (${chunk.source})\n${chunk.text}`);
  });

  const promptText = `\n# Institutional Context (RAG Data)\nThe following is real institutional data from College of the Siskiyous. Each item is tagged with a number [1], [2], etc. You MUST cite these numbers when using facts from this data.\n\n${numberedSections.join('\n\n---\n\n')}\n`;

  return { promptText, citations };
}

/**
 * Get total chunk count for UI display
 */
export function getRAGStats(): { totalChunks: number; bySource: Record<string, number> } {
  const index = getSearchIndex();
  if (!index) return { totalChunks: 0, bySource: {} };

  const bySource: Record<string, number> = {};
  for (const entry of index.entries) {
    bySource[entry.source] = (bySource[entry.source] || 0) + 1;
  }

  return { totalChunks: index.totalChunks, bySource };
}
