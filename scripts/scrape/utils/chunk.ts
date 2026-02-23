/**
 * Text chunking utilities with token counting
 */

import { DataChunk } from '../../../lib/types';

/**
 * Rough token count estimate: ~4 chars per token for English text.
 * Close enough for budget calculations without needing tiktoken.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Split text into chunks at paragraph boundaries, respecting a max token budget */
export function chunkText(
  text: string,
  maxTokens: number = 800
): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const combined = current ? `${current}\n\n${trimmed}` : trimmed;
    if (estimateTokens(combined) > maxTokens && current) {
      chunks.push(current);
      current = trimmed;
    } else {
      current = combined;
    }
  }

  if (current) {
    chunks.push(current);
  }

  // If a single paragraph is still too large, split by sentences
  return chunks.flatMap((chunk) => {
    if (estimateTokens(chunk) > maxTokens * 1.5) {
      return splitBySentence(chunk, maxTokens);
    }
    return [chunk];
  });
}

function splitBySentence(text: string, maxTokens: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const combined = current + sentence;
    if (estimateTokens(combined) > maxTokens && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = combined;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

/**
 * Create DataChunk objects from text with metadata
 */
export function createChunks(
  text: string,
  base: Omit<DataChunk, 'id' | 'text' | 'tokenCount'> & { idPrefix: string },
  maxTokens: number = 800
): DataChunk[] {
  const textChunks = chunkText(text, maxTokens);

  return textChunks.map((chunkText, index) => ({
    id: `${base.idPrefix}-${index}`,
    source: base.source,
    sourceId: base.sourceId,
    title: textChunks.length > 1 ? `${base.title} (Part ${index + 1})` : base.title,
    text: chunkText,
    metadata: base.metadata,
    tags: base.tags,
    tokenCount: estimateTokens(chunkText),
  }));
}
