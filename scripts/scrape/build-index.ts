/**
 * Build unified search index from all scraped data chunks
 * Reads all chunk files from data/ subdirectories and creates a single search-index.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { DataChunk, SearchIndex, SearchIndexEntry } from '../../lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SOURCES = ['policies', 'reviews', 'accreditation', 'meetings'] as const;

function loadChunksFromDir(dirPath: string): { chunks: DataChunk[]; files: Map<string, string> } {
  const chunksDir = path.join(dirPath, 'chunks');
  const chunks: DataChunk[] = [];
  const fileMap = new Map<string, string>(); // chunkId → relative file path

  if (!fs.existsSync(chunksDir)) {
    return { chunks, files: fileMap };
  }

  const files = fs.readdirSync(chunksDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(chunksDir, file);
    const relativePath = path.relative(DATA_DIR, filePath);
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const fileChunks = Array.isArray(content) ? content : [content];
      for (const chunk of fileChunks) {
        if (chunk.id && chunk.text) {
          chunks.push(chunk as DataChunk);
          fileMap.set(chunk.id, relativePath);
        }
      }
    } catch (err) {
      console.warn(`  Warning: Failed to parse ${filePath}:`, err instanceof Error ? err.message : err);
    }
  }

  return { chunks, files: fileMap };
}

export async function buildSearchIndex(): Promise<SearchIndex> {
  console.log('Building unified search index...\n');

  const allEntries: SearchIndexEntry[] = [];
  let totalChunks = 0;

  for (const source of SOURCES) {
    const sourceDir = path.join(DATA_DIR, source);
    if (!fs.existsSync(sourceDir)) {
      console.log(`  Skipping ${source}/ (not found)`);
      continue;
    }

    const { chunks, files } = loadChunksFromDir(sourceDir);
    console.log(`  ${source}: ${chunks.length} chunks`);
    totalChunks += chunks.length;

    for (const chunk of chunks) {
      allEntries.push({
        chunkId: chunk.id,
        source: chunk.source,
        title: chunk.title,
        tags: chunk.tags,
        metadata: chunk.metadata,
        filePath: files.get(chunk.id) || '',
      });
    }
  }

  const index: SearchIndex = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    totalChunks,
    entries: allEntries,
  };

  const indexPath = path.join(DATA_DIR, 'search-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

  console.log(`\nSearch index built: ${totalChunks} chunks → ${indexPath}`);
  return index;
}

// Allow running standalone
if (process.argv[1] && process.argv[1].includes('build-index')) {
  buildSearchIndex()
    .then((idx) => console.log(`Done! ${idx.totalChunks} total chunks indexed.`))
    .catch((err) => {
      console.error('Index build failed:', err);
      process.exit(1);
    });
}
