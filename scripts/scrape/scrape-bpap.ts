/**
 * Scrape Board Policies & Administrative Procedures index from siskiyous.edu/bpap/
 * This page lists all policies organized by chapter (I-VII) with links to BoardDocs.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchHtml } from './utils/fetch-html';
import { normalize } from './utils/normalize';
import { scrapeBoardDocsPolicies } from './scrape-boarddocs-policies';

const BPAP_URL = 'https://www.siskiyous.edu/bpap/';

interface PolicyLink {
  title: string;
  policyNumber: string;
  policyType: 'BP' | 'AP';
  chapter: string;
  chapterTitle: string;
  url: string;
}

const CHAPTER_MAP: Record<string, string> = {
  '1': 'I - The District',
  '2': 'II - Board of Trustees',
  '3': 'III - General Institution',
  '4': 'IV - Academic Affairs',
  '5': 'V - Student Services',
  '6': 'VI - Business and Fiscal Affairs',
  '7': 'VII - Human Resources',
};

function getChapter(policyNumber: string): { chapter: string; chapterTitle: string } {
  const firstDigit = policyNumber.charAt(0);
  const romanNumeral = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][parseInt(firstDigit)] || '';
  return {
    chapter: romanNumeral,
    chapterTitle: CHAPTER_MAP[firstDigit] || `Chapter ${firstDigit}`,
  };
}

export async function scrapeBpapIndex(): Promise<PolicyLink[]> {
  console.log('Scraping BPAP index from siskiyous.edu...');

  const $ = await fetchHtml(BPAP_URL);
  const policies: PolicyLink[] = [];

  // The BPAP page lists policies as links. Look for links to BoardDocs.
  $('a[href*="boarddocs.com"]').each((_i, el) => {
    const href = $(el).attr('href') || '';
    const text = normalize($(el).text());

    if (!text || !href) return;

    // Parse policy type and number from text like "BP 1200" or "AP 3050"
    const match = text.match(/^(BP|AP)\s+(\d+)\s*[-–]?\s*(.*)/i);
    if (match) {
      const policyType = match[1].toUpperCase() as 'BP' | 'AP';
      const policyNumber = match[2];
      const title = match[3] || text;
      const { chapter, chapterTitle } = getChapter(policyNumber);

      policies.push({
        title: normalize(title),
        policyNumber,
        policyType,
        chapter,
        chapterTitle,
        url: href,
      });
    }
  });

  // If the page structure doesn't have direct BoardDocs links,
  // also try to find policy listings in tables or lists
  if (policies.length === 0) {
    console.log('  No BoardDocs links found directly, trying alternative selectors...');
    $('table tr, li').each((_i, el) => {
      const text = normalize($(el).text());
      const link = $(el).find('a').first();
      const href = link.attr('href') || '';

      const match = text.match(/(BP|AP)\s+(\d+)\s*[-–]?\s*(.*)/i);
      if (match && href) {
        const policyType = match[1].toUpperCase() as 'BP' | 'AP';
        const policyNumber = match[2];
        const title = match[3] || text;
        const { chapter, chapterTitle } = getChapter(policyNumber);

        policies.push({
          title: normalize(title),
          policyNumber,
          policyType,
          chapter,
          chapterTitle,
          url: href.startsWith('http') ? href : new URL(href, BPAP_URL).toString(),
        });
      }
    });
  }

  console.log(`  Found ${policies.length} policy links`);
  return policies;
}

/**
 * Main: scrape BPAP index then fetch individual policy content
 */
export async function scrapePolicies(): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data', 'policies');
  const chunksDir = path.join(dataDir, 'chunks');
  fs.mkdirSync(chunksDir, { recursive: true });

  const policyLinks = await scrapeBpapIndex();

  // Save the policy index
  fs.writeFileSync(
    path.join(dataDir, 'index.json'),
    JSON.stringify(
      {
        source: 'siskiyous.edu/bpap',
        scrapedAt: new Date().toISOString(),
        totalPolicies: policyLinks.length,
        policies: policyLinks,
      },
      null,
      2
    )
  );

  // Fetch individual policy content from BoardDocs
  await scrapeBoardDocsPolicies(policyLinks, chunksDir);
}

// Allow running standalone
if (process.argv[1] && process.argv[1].includes('scrape-bpap')) {
  scrapePolicies()
    .then(() => console.log('Policy scraping complete!'))
    .catch((err) => {
      console.error('Policy scraping failed:', err);
      process.exit(1);
    });
}
