/**
 * Playwright session manager for BoardDocs scraping
 * BoardDocs is JS-heavy and requires a real browser to render content.
 */

import { chromium, Browser, Page } from 'playwright';

const BOARDDOCS_BASE = 'https://go.boarddocs.com/ca/sjccd/Board.nsf';

let browser: Browser | null = null;

/**
 * Get or create a shared browser instance
 */
export async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
    });
  }
  return browser;
}

/**
 * Close the shared browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Navigate to a BoardDocs page and wait for content to load
 */
export async function navigateBoardDocs(
  page: Page,
  path: string,
  waitSelector?: string
): Promise<void> {
  const url = path.startsWith('http') ? path : `${BOARDDOCS_BASE}/${path}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  if (waitSelector) {
    await page.waitForSelector(waitSelector, { timeout: 15000 }).catch(() => {
      console.warn(`  Warning: Selector "${waitSelector}" not found on ${url}`);
    });
  }

  // Extra settle time for JS rendering
  await page.waitForTimeout(2000);
}

/**
 * Extract text content from a BoardDocs page element
 */
export async function extractContent(page: Page, selector: string): Promise<string> {
  const element = await page.$(selector);
  if (!element) return '';
  return (await element.textContent()) || '';
}

/**
 * Extract HTML content from a BoardDocs page element
 */
export async function extractInnerHtml(page: Page, selector: string): Promise<string> {
  const element = await page.$(selector);
  if (!element) return '';
  return await element.innerHTML();
}

/**
 * Create a new page in the shared browser
 */
export async function createPage(): Promise<Page> {
  const b = await getBrowser();
  const page = await b.newPage();
  // Set a reasonable viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  return page;
}
