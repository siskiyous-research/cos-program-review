/**
 * Provide scraped review data as HistoricalData for the app.
 * Reads from data/reviews/index.json and converts to HistoricalData format.
 */

import * as fs from 'fs';
import * as path from 'path';
import { HistoricalData, HistoricalReview } from './types';

const REVIEWS_INDEX_PATH = path.join(process.cwd(), 'data', 'reviews', 'index.json');

interface ReviewIndexEntry {
  title: string;
  program?: string;
  programCategory?: string;
  year?: number;
  reviewType: 'Annual' | 'Comprehensive';
  url: string;
}

interface ReviewIndex {
  totalReviews: number;
  reviews: ReviewIndexEntry[];
}

let cachedData: HistoricalData | null = null;

/**
 * Load scraped reviews and convert to HistoricalData format (keyed by program name)
 */
export function getScrapedHistoricalData(): HistoricalData {
  if (cachedData) return cachedData;

  if (!fs.existsSync(REVIEWS_INDEX_PATH)) {
    return {};
  }

  try {
    const content = fs.readFileSync(REVIEWS_INDEX_PATH, 'utf-8');
    const index: ReviewIndex = JSON.parse(content);

    const result: HistoricalData = {};

    for (const review of index.reviews) {
      if (!review.program) continue;

      const historicalReview: HistoricalReview = {
        year: review.year || 0,
        type: review.reviewType,
        title: review.title,
        content: `Scraped from BoardDocs. See original at: ${review.url}`,
        url: review.url,
      };

      if (!result[review.program]) {
        result[review.program] = [];
      }
      result[review.program].push(historicalReview);
    }

    // Sort each program's reviews by year descending
    for (const program of Object.keys(result)) {
      result[program].sort((a, b) => b.year - a.year);
    }

    cachedData = result;
    return result;
  } catch (err) {
    console.error('Failed to load scraped historical data:', err);
    return {};
  }
}
