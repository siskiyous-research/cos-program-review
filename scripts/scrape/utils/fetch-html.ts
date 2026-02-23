/**
 * HTTP fetch + cheerio wrapper with retry and rate limiting
 */

import * as cheerio from 'cheerio';

const RATE_LIMIT_MS = 1000; // 1 second between requests
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

let lastRequestTime = 0;

async function rateLimitWait(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/**
 * Fetch a URL and return a cheerio-parsed document
 */
export async function fetchHtml(url: string): Promise<cheerio.CheerioAPI> {
  await rateLimitWait();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) COS-ProgramReview-Scraper/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
      }

      const html = await response.text();
      return cheerio.load(html);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Attempt ${attempt + 1}/${MAX_RETRIES} failed for ${url}: ${lastError.message}`);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url}`);
}

/**
 * Fetch raw text/content from a URL
 */
export async function fetchText(url: string): Promise<string> {
  await rateLimitWait();

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) COS-ProgramReview-Scraper/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
  }

  return response.text();
}

/**
 * Fetch binary content (for PDFs)
 */
export async function fetchBuffer(url: string): Promise<Buffer> {
  await rateLimitWait();

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) COS-ProgramReview-Scraper/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
