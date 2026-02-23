/**
 * Scrape historical program reviews from BoardDocs
 * Uses Playwright since BoardDocs is heavily JS-rendered.
 *
 * The BoardDocs library page has a jQuery UI accordion with a "Program Review"
 * section containing year folders (e.g. "2023/2024 Program Reviews"). Each year
 * folder, when clicked, reveals a detail panel (#view-library-item) with direct
 * links to PDF files of individual program reviews. We click each year folder,
 * collect the PDF URLs, then download and extract text from each PDF.
 *
 * Entry point: go.boarddocs.com/ca/sjccd/Board.nsf/goto?open&id=C7HTHH70EEEB
 */

import * as fs from 'fs';
import * as path from 'path';
import { DataChunk } from '../../lib/types';
import {
  createPage,
  navigateBoardDocs,
  closeBrowser,
} from './utils/boarddocs-browser';
import { extractPdfFromUrl } from './utils/pdf-extractor';
import { normalizeParagraphs } from './utils/normalize';
import { createChunks } from './utils/chunk';
import { slugify } from './utils/normalize';
import { PROGRAM_LIST } from '../../lib/constants';

const REVIEWS_URL =
  'https://go.boarddocs.com/ca/sjccd/Board.nsf/goto?open&id=C7HTHH70EEEB';

// Build a flat list of all program names for matching
const ALL_PROGRAMS = [
  ...PROGRAM_LIST.instructional,
  ...PROGRAM_LIST.academicAffairs,
  ...PROGRAM_LIST.presidentsOffice,
  ...PROGRAM_LIST.administrativeServices,
  ...PROGRAM_LIST.studentServices,
];

// Map programs to their categories
function getProgramCategory(programName: string): string | undefined {
  if (PROGRAM_LIST.instructional.includes(programName)) return 'instructional';
  if (PROGRAM_LIST.academicAffairs.includes(programName)) return 'academicAffairs';
  if (PROGRAM_LIST.presidentsOffice.includes(programName)) return 'presidentsOffice';
  if (PROGRAM_LIST.administrativeServices.includes(programName))
    return 'administrativeServices';
  if (PROGRAM_LIST.studentServices.includes(programName)) return 'studentServices';
  return undefined;
}

/** Try to match a document title to a known program name */
function matchProgram(title: string): string | undefined {
  const lower = title.toLowerCase();
  // Exact substring match first
  for (const prog of ALL_PROGRAMS) {
    if (lower.includes(prog.toLowerCase())) return prog;
  }
  // Partial keyword match
  const keywords: Record<string, string> = {
    nursing: 'Nursing',
    welding: 'Welding',
    ems: 'Emergency Medical Services (EMS)',
    'fire science': 'Fire',
    fire: 'Fire',
    adhs: 'Alcohol & Drug Studies (ADHS)',
    'drug studies': 'Alcohol & Drug Studies (ADHS)',
    'early childhood': 'Early Childhood Education',
    business: 'Business and Computer Sciences',
    humanities: 'Humanities and Social Sciences',
    math: 'Math',
    science: 'Sciences',
    library: 'Library',
    counseling: 'Counseling & Advising - Transfer & Orientation',
    'financial aid': 'Financial Aid, Veterans and AB540',
    bookstore: 'Bookstore',
    housing: 'Student Housing',
    'admin justice': 'Administration of Justice',
    'fine arts': 'Fine and Performing Arts',
    'modern languages': 'Modern Languages',
    'distance learning': 'Distance Learning',
    'dual enrollment': 'Dual Enrollment',
  };

  for (const [keyword, program] of Object.entries(keywords)) {
    if (lower.includes(keyword)) return program;
  }

  return undefined;
}

/** Extract year from document title */
function extractYear(title: string): number | undefined {
  const match = title.match(/\b(20\d{2})\b/);
  return match ? parseInt(match[1]) : undefined;
}

/** Determine review type from title */
function extractReviewType(title: string): 'Annual' | 'Comprehensive' {
  const lower = title.toLowerCase();
  if (lower.includes('comprehensive') || lower.includes('full review')) return 'Comprehensive';
  return 'Annual';
}

interface ReviewDoc {
  title: string;
  content: string;
  program?: string;
  programCategory?: string;
  year?: number;
  reviewType: 'Annual' | 'Comprehensive';
  url: string;
}

export async function scrapeReviews(): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data', 'reviews');
  const chunksDir = path.join(dataDir, 'chunks');
  fs.mkdirSync(chunksDir, { recursive: true });

  console.log('Scraping program reviews from BoardDocs...');
  console.log(`  URL: ${REVIEWS_URL}`);

  const page = await createPage();
  const reviews: ReviewDoc[] = [];
  const allChunks: DataChunk[] = [];
  const seenUrls = new Set<string>();

  try {
    await navigateBoardDocs(page, REVIEWS_URL, '#library-accordion');

    // The "Program Review" accordion section contains year folders.
    // Get the year folder links from the active accordion panel.
    const yearFolderCount = await page.evaluate(() => {
      const panel = document.querySelector('.ui-accordion-content-active');
      return panel ? panel.querySelectorAll('a.library, a[class*="library"]').length : 0;
    });

    console.log(`  Found ${yearFolderCount} year folders`);

    // Click each year folder to reveal PDF links
    for (let folderIdx = 0; folderIdx < yearFolderCount; folderIdx++) {
      // Re-navigate for each folder to reset the page state
      if (folderIdx > 0) {
        await navigateBoardDocs(page, REVIEWS_URL, '#library-accordion');
        await page.waitForTimeout(1000);
      }

      // Click the folder
      const folderName = await page.evaluate((idx) => {
        const panel = document.querySelector('.ui-accordion-content-active');
        if (!panel) return null;
        const folders = panel.querySelectorAll('a.library, a[class*="library"]');
        if (idx < folders.length) {
          const text = (folders[idx].textContent || '').trim();
          (folders[idx] as HTMLElement).click();
          return text;
        }
        return null;
      }, folderIdx);

      if (!folderName) continue;
      console.log(`\n  === ${folderName} ===`);

      // Wait for the detail panel to load with PDF links
      await page.waitForTimeout(3000);
      await page.waitForSelector('#view-library-item a.public-file', { timeout: 10000 }).catch(() => {});

      // Collect all PDF URLs from the detail panel
      // Use .public-file links (direct file downloads) to avoid duplicates
      const pdfLinks = await page.evaluate(() => {
        const panel = document.querySelector('#view-library-item');
        if (!panel) return [];

        const links: { title: string; url: string }[] = [];
        const fileLinks = panel.querySelectorAll('a.public-file');

        for (const a of fileLinks) {
          const href = a.getAttribute('href') || '';
          const text = (a.textContent || '').trim();
          if (href.toLowerCase().includes('.pdf')) {
            // Build absolute URL
            const url = href.startsWith('http')
              ? href
              : `https://go.boarddocs.com${href}`;
            // Clean the title: remove file size like "(1,938 KB)"
            const cleanTitle = text.replace(/\s*\([\d,]+\s*KB\)\s*$/, '').replace(/\.pdf$/i, '').trim();
            links.push({ title: cleanTitle, url });
          }
        }
        return links;
      });

      console.log(`  Found ${pdfLinks.length} PDF files`);

      // Extract the year from the folder name for fallback
      const folderYear = extractYear(folderName);

      for (let j = 0; j < pdfLinks.length; j++) {
        const { title: rawTitle, url: pdfUrl } = pdfLinks[j];

        // Deduplicate by URL
        if (seenUrls.has(pdfUrl)) {
          console.log(`  [${j + 1}/${pdfLinks.length}] ${rawTitle} (duplicate, skipping)`);
          continue;
        }
        seenUrls.add(pdfUrl);

        console.log(`  [${j + 1}/${pdfLinks.length}] ${rawTitle}`);

        try {
          const pdfContent = await extractPdfFromUrl(pdfUrl);

          if (pdfContent.text.length < 50) {
            console.log(`    Skipped (insufficient text in PDF)`);
            continue;
          }

          // Use PDF title or the link title
          const title = pdfContent.title || rawTitle;
          const program = matchProgram(title) || matchProgram(rawTitle);
          const year = extractYear(title) || extractYear(rawTitle) || folderYear;
          const reviewType = extractReviewType(title) || extractReviewType(rawTitle);

          const review: ReviewDoc = {
            title,
            content: pdfContent.text,
            program,
            programCategory: program ? getProgramCategory(program) : undefined,
            year,
            reviewType,
            url: pdfUrl,
          };

          reviews.push(review);

          const chunks = createChunks(
            pdfContent.text,
            {
              idPrefix: `review-${slugify(title)}`,
              source: 'review',
              sourceId: slugify(title),
              title,
              metadata: {
                program: review.program,
                programCategory: review.programCategory,
                year: review.year,
                reviewType: review.reviewType,
              },
              tags: [
                'review',
                review.reviewType.toLowerCase(),
                ...(review.program ? [`program-${slugify(review.program)}`] : []),
                ...(review.year ? [`year-${review.year}`] : []),
              ],
            },
            800
          );

          allChunks.push(...chunks);

          const fileName = `${slugify(rawTitle || title)}.json`;
          fs.writeFileSync(path.join(chunksDir, fileName), JSON.stringify(chunks, null, 2));

          console.log(
            `    → ${program || 'unmatched'} | ${year || 'no year'} | ${pdfContent.numPages} pages | ${chunks.length} chunk(s)`
          );
        } catch (err) {
          console.error(
            `    Error:`,
            err instanceof Error ? err.message : err
          );
        }
      }
    }
  } finally {
    await closeBrowser();
  }

  // Save index
  fs.writeFileSync(
    path.join(dataDir, 'index.json'),
    JSON.stringify(
      {
        source: 'BoardDocs Program Reviews',
        scrapedAt: new Date().toISOString(),
        totalReviews: reviews.length,
        reviews: reviews.map((r) => ({
          title: r.title,
          program: r.program,
          programCategory: r.programCategory,
          year: r.year,
          reviewType: r.reviewType,
          url: r.url,
        })),
      },
      null,
      2
    )
  );

  console.log(`\nTotal review chunks: ${allChunks.length}`);
}

// Allow running standalone
if (process.argv[1] && process.argv[1].includes('scrape-boarddocs-reviews')) {
  scrapeReviews()
    .then(() => console.log('Review scraping complete!'))
    .catch((err) => {
      console.error('Review scraping failed:', err);
      process.exit(1);
    });
}
