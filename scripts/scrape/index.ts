/**
 * Master scrape orchestrator
 * Run with: npm run scrape
 *
 * Executes all scrapers in sequence, then builds the unified search index.
 */

import { scrapePolicies } from './scrape-bpap';
import { scrapeReviews } from './scrape-boarddocs-reviews';
import { scrapeAccreditation } from './scrape-accreditation';
import { scrapeMeetings } from './scrape-boarddocs-meetings';
import { buildSearchIndex } from './build-index';

async function main() {
  const startTime = Date.now();
  console.log('=== COS Program Review RAG Data Scraper ===\n');

  const args = process.argv.slice(2);
  const runAll = args.length === 0;
  const targets = new Set(args);

  try {
    // 1. Board Policies & Admin Procedures
    if (runAll || targets.has('policies')) {
      console.log('\n── Step 1: Board Policies & Administrative Procedures ──');
      await scrapePolicies();
    }

    // 2. Historical Program Reviews
    if (runAll || targets.has('reviews')) {
      console.log('\n── Step 2: Historical Program Reviews ──');
      await scrapeReviews();
    }

    // 3. Accreditation Documents
    if (runAll || targets.has('accreditation')) {
      console.log('\n── Step 3: Accreditation Documents ──');
      await scrapeAccreditation();
    }

    // 4. Board Meetings (Phase 2 stub)
    if (runAll || targets.has('meetings')) {
      console.log('\n── Step 4: Board Meetings (Phase 2) ──');
      await scrapeMeetings();
    }

    // 5. Build unified search index
    console.log('\n── Step 5: Building Search Index ──');
    const index = await buildSearchIndex();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n=== Scraping Complete ===`);
    console.log(`  Total chunks indexed: ${index.totalChunks}`);
    console.log(`  Time elapsed: ${elapsed}s`);
    console.log(`  Data directory: data/`);
  } catch (err) {
    console.error('\n=== Scraping Failed ===');
    console.error(err);
    process.exit(1);
  }
}

main();
