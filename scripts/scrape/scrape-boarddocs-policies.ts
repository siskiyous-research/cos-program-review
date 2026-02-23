/**
 * Fetch individual policy content from BoardDocs
 * BoardDocs policies are JS-rendered, so we use Playwright.
 */

import * as fs from 'fs';
import * as path from 'path';
import { DataChunk } from '../../lib/types';
import { createPage, navigateBoardDocs, closeBrowser } from './utils/boarddocs-browser';
import { normalizeParagraphs } from './utils/normalize';
import { createChunks, estimateTokens } from './utils/chunk';
import { slugify } from './utils/normalize';

interface PolicyLink {
  title: string;
  policyNumber: string;
  policyType: 'BP' | 'AP';
  chapter: string;
  chapterTitle: string;
  url: string;
}

// Map policy chapters to relevant review section types
const CHAPTER_SECTION_MAP: Record<string, string[]> = {
  I: ['program_description', 'ni_program_description'],
  II: ['program_info'],
  III: ['program_description', 'external_factors', 'ni_program_description', 'ni_external_factors'],
  IV: ['slo_assessment', 'outcomes_assessment', 'ni_outcomes_assessment'],
  V: ['support_obstacles', 'ni_quantitative_qualitative_data'],
  VI: ['budgetary_needs', 'closing_the_loop_annual', 'ni_closing_budget_loop', 'action_plan'],
  VII: ['program_info', 'ni_program_description'],
};

// Map chapters to ACCJC standards
const CHAPTER_STANDARD_MAP: Record<string, string[]> = {
  I: ['I.A', 'IV.C'],
  II: ['IV.C'],
  III: ['I.A', 'I.B', 'II.A'],
  IV: ['II.A', 'I.B'],
  V: ['II.C'],
  VI: ['III.D', 'III.B'],
  VII: ['III.A'],
};

function buildTags(policy: PolicyLink): string[] {
  const tags = [
    'policy',
    policy.policyType.toLowerCase(),
    `chapter-${policy.chapter.toLowerCase()}`,
    `policy-${policy.policyNumber}`,
  ];

  // Add related ACCJC standard tags
  const standards = CHAPTER_STANDARD_MAP[policy.chapter] || [];
  for (const std of standards) {
    tags.push(`accjc-${std.toLowerCase().replace('.', '')}`);
  }

  return tags;
}

/**
 * Scrape individual policy content from BoardDocs URLs
 */
export async function scrapeBoardDocsPolicies(
  policies: PolicyLink[],
  chunksDir: string
): Promise<DataChunk[]> {
  console.log(`\nFetching ${policies.length} policy documents from BoardDocs...`);

  const allChunks: DataChunk[] = [];
  const page = await createPage();

  try {
    for (let i = 0; i < policies.length; i++) {
      const policy = policies[i];
      console.log(
        `  [${i + 1}/${policies.length}] ${policy.policyType} ${policy.policyNumber}: ${policy.title}`
      );

      try {
        await navigateBoardDocs(page, policy.url, '.gl-policy-text, .policy-text, #TextContainer');

        // Extract the policy text from various possible selectors
        let text = '';
        for (const selector of [
          '.gl-policy-text',
          '.policy-text',
          '#TextContainer',
          '.policy-content',
          'article',
          '.content',
        ]) {
          const el = await page.$(selector);
          if (el) {
            text = (await el.textContent()) || '';
            if (text.trim().length > 50) break;
          }
        }

        if (!text || text.trim().length < 50) {
          // Fallback: try to get all visible text from the main content area
          text = await page.evaluate(() => {
            const main = document.querySelector('main, #content, .content, body');
            return main?.textContent || '';
          });
        }

        text = normalizeParagraphs(text);

        if (text.length < 20) {
          console.log(`    Skipped (no content found)`);
          continue;
        }

        const chunks = createChunks(
          text,
          {
            idPrefix: `policy-${policy.policyType.toLowerCase()}-${policy.policyNumber}`,
            source: 'policy',
            sourceId: `${policy.policyType}-${policy.policyNumber}`,
            title: `${policy.policyType} ${policy.policyNumber} - ${policy.title}`,
            metadata: {
              chapter: policy.chapter,
              policyNumber: policy.policyNumber,
              policyType: policy.policyType,
            },
            tags: buildTags(policy),
          },
          800
        );

        allChunks.push(...chunks);

        // Save chunks to individual file
        const fileName = `${policy.policyType.toLowerCase()}-${policy.policyNumber}.json`;
        fs.writeFileSync(path.join(chunksDir, fileName), JSON.stringify(chunks, null, 2));

        console.log(
          `    Extracted ${chunks.length} chunk(s), ~${chunks.reduce((sum, c) => sum + c.tokenCount, 0)} tokens`
        );
      } catch (err) {
        console.error(
          `    Error scraping ${policy.policyType} ${policy.policyNumber}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  } finally {
    await closeBrowser();
  }

  console.log(`\nTotal policy chunks: ${allChunks.length}`);
  return allChunks;
}
