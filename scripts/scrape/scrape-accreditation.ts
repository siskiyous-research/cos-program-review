/**
 * Scrape accreditation documents from siskiyous.edu/accreditation/
 * Downloads PDFs (ISER, Action Letters, Peer Review reports) and extracts text.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DataChunk } from '../../lib/types';
import { fetchHtml } from './utils/fetch-html';
import { extractPdfFromUrl } from './utils/pdf-extractor';
import { normalize, normalizeParagraphs, slugify } from './utils/normalize';
import { createChunks } from './utils/chunk';

const ACCREDITATION_URL = 'https://www.siskiyous.edu/accreditation/';

interface AccreditationDoc {
  title: string;
  url: string;
  type: 'iser' | 'action_letter' | 'peer_review' | 'midterm' | 'annual' | 'other';
  year?: number;
}

/** Classify an accreditation document by its title */
function classifyDoc(title: string): AccreditationDoc['type'] {
  const lower = title.toLowerCase();
  if (lower.includes('iser') || lower.includes('institutional self-evaluation'))
    return 'iser';
  if (lower.includes('action letter') || lower.includes('action-letter'))
    return 'action_letter';
  if (lower.includes('peer review') || lower.includes('visiting team'))
    return 'peer_review';
  if (lower.includes('midterm')) return 'midterm';
  if (lower.includes('annual report')) return 'annual';
  return 'other';
}

/** Map accreditation doc types to ACCJC standards */
function getStandardTags(type: AccreditationDoc['type']): string[] {
  switch (type) {
    case 'iser':
      return ['accjc-i', 'accjc-ii', 'accjc-iii', 'accjc-iv'];
    case 'action_letter':
      return ['accjc-compliance'];
    case 'peer_review':
      return ['accjc-i', 'accjc-ii', 'accjc-iii', 'accjc-iv'];
    case 'midterm':
      return ['accjc-compliance', 'accjc-follow-up'];
    default:
      return ['accreditation'];
  }
}

export async function scrapeAccreditation(): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data', 'accreditation');
  const chunksDir = path.join(dataDir, 'chunks');
  fs.mkdirSync(chunksDir, { recursive: true });

  console.log('Scraping accreditation documents from siskiyous.edu...');

  const $ = await fetchHtml(ACCREDITATION_URL);
  const docs: AccreditationDoc[] = [];

  // Find links to PDF documents
  $('a[href$=".pdf"], a[href*=".pdf"]').each((_i, el) => {
    const href = $(el).attr('href') || '';
    const text = normalize($(el).text());

    if (!text || !href) return;

    const url = href.startsWith('http')
      ? href
      : new URL(href, ACCREDITATION_URL).toString();

    const yearMatch = text.match(/\b(20\d{2})\b/);

    docs.push({
      title: text,
      url,
      type: classifyDoc(text),
      year: yearMatch ? parseInt(yearMatch[1]) : undefined,
    });
  });

  // Also check for links within the page content (non-PDF accreditation pages)
  $('a').each((_i, el) => {
    const href = $(el).attr('href') || '';
    const text = normalize($(el).text());

    if (!text || !href) return;
    if (href.endsWith('.pdf')) return; // Already handled

    const lower = text.toLowerCase();
    if (
      lower.includes('iser') ||
      lower.includes('self-evaluation') ||
      lower.includes('action letter') ||
      lower.includes('accreditation report')
    ) {
      const url = href.startsWith('http')
        ? href
        : new URL(href, ACCREDITATION_URL).toString();
      const yearMatch = text.match(/\b(20\d{2})\b/);

      docs.push({
        title: text,
        url,
        type: classifyDoc(text),
        year: yearMatch ? parseInt(yearMatch[1]) : undefined,
      });
    }
  });

  console.log(`  Found ${docs.length} accreditation documents`);

  const allChunks: DataChunk[] = [];
  const processedDocs: AccreditationDoc[] = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    console.log(`  [${i + 1}/${docs.length}] ${doc.title}`);

    try {
      let text = '';

      if (doc.url.toLowerCase().includes('.pdf')) {
        // Extract text from PDF
        const pdfContent = await extractPdfFromUrl(doc.url);
        text = pdfContent.text;
        console.log(`    PDF: ${pdfContent.numPages} pages`);
      } else {
        // Fetch HTML page and extract text
        const page$ = await fetchHtml(doc.url);
        text = normalizeParagraphs(
          page$('main, .content, article, #content, .page-content').first().text() ||
            page$('body').text()
        );
      }

      if (text.length < 50) {
        console.log(`    Skipped (insufficient content)`);
        continue;
      }

      // Map standard IDs from document text (look for "Standard I", etc.)
      const standardIds: string[] = [];
      const stdMatches = text.match(/Standard\s+(I{1,3}V?|IV)\b/gi);
      if (stdMatches) {
        for (const m of stdMatches) {
          const id = m.replace(/Standard\s+/i, '').trim();
          if (!standardIds.includes(id)) standardIds.push(id);
        }
      }

      const chunks = createChunks(
        text,
        {
          idPrefix: `accred-${slugify(doc.title)}`,
          source: 'accreditation',
          sourceId: slugify(doc.title),
          title: doc.title,
          metadata: {
            year: doc.year,
            standardId: standardIds[0],
          },
          tags: [
            'accreditation',
            doc.type,
            ...getStandardTags(doc.type),
            ...(doc.year ? [`year-${doc.year}`] : []),
          ],
        },
        800
      );

      allChunks.push(...chunks);
      processedDocs.push(doc);

      // Save chunks
      const fileName = `${slugify(doc.title)}.json`;
      fs.writeFileSync(path.join(chunksDir, fileName), JSON.stringify(chunks, null, 2));

      console.log(
        `    → ${doc.type} | ${chunks.length} chunk(s), ~${chunks.reduce((sum, c) => sum + c.tokenCount, 0)} tokens`
      );
    } catch (err) {
      console.error(
        `    Error processing ${doc.title}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  // Save index
  fs.writeFileSync(
    path.join(dataDir, 'index.json'),
    JSON.stringify(
      {
        source: 'siskiyous.edu/accreditation',
        scrapedAt: new Date().toISOString(),
        totalDocs: processedDocs.length,
        documents: processedDocs,
      },
      null,
      2
    )
  );

  console.log(`\nTotal accreditation chunks: ${allChunks.length}`);
}

// Allow running standalone
if (process.argv[1] && process.argv[1].includes('scrape-accreditation')) {
  scrapeAccreditation()
    .then(() => console.log('Accreditation scraping complete!'))
    .catch((err) => {
      console.error('Accreditation scraping failed:', err);
      process.exit(1);
    });
}
