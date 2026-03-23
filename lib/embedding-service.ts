/**
 * Embedding Service
 * Generates embeddings using OpenRouter's models
 * and performs semantic search/similarity matching
 */

import { getSetting } from './settings';

const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

/**
 * Generate embedding for a text string via OpenRouter
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = await getSetting('openrouter_api_key');
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter embedding error: ${error.message}`);
  }

  const data = await response.json();
  if (!data.data || data.data.length === 0) {
    throw new Error('No embedding returned from OpenRouter');
  }

  return data.data[0].embedding;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Batch generate embeddings via OpenRouter
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > 2048) {
    throw new Error('Batch size exceeds 2048 - please split into smaller batches');
  }

  const apiKey = await getSetting('openrouter_api_key');
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter embedding error: ${error.message}`);
  }

  const data = await response.json();
  if (!data.data) {
    throw new Error('No embeddings returned from OpenRouter');
  }

  // Sort by index to maintain order
  return data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((item: { embedding: number[] }) => item.embedding);
}
