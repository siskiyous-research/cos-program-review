/**
 * Document text extraction utilities
 * Supports PDF, DOCX, XLSX/XLS/CSV, PPTX, and URL scraping
 */

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import * as cheerio from 'cheerio';

export interface ExtractionResult {
  text: string;
  pageCount?: number;
}

/**
 * Extract text from a file buffer based on filename extension
 */
export async function extractText(buffer: Buffer, filename: string): Promise<ExtractionResult> {
  const ext = filename.toLowerCase().split('.').pop() || '';

  switch (ext) {
    case 'pdf':
      return extractPDF(buffer);
    case 'docx':
      return extractDOCX(buffer);
    case 'xlsx':
    case 'xls':
      return extractSpreadsheet(buffer);
    case 'csv':
      return extractCSV(buffer);
    case 'pptx':
      return extractPPTX(buffer);
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}

/**
 * Estimate processing time in seconds based on file size and type
 */
export function estimateProcessingTime(fileSize: number, fileType: string): number {
  const mb = fileSize / (1024 * 1024);
  switch (fileType) {
    case 'pdf':
      return Math.max(1, Math.ceil(mb * 2));
    case 'docx':
    case 'xlsx':
    case 'xls':
    case 'csv':
    case 'pptx':
      return Math.max(1, Math.ceil(mb * 1));
    case 'url':
      return 4;
    default:
      return Math.max(1, Math.ceil(mb * 2));
  }
}

async function extractPDF(buffer: Buffer): Promise<ExtractionResult> {
  // pdf-parse v2 marks some methods as private in types but they work at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parser: any = new PDFParse({ data: new Uint8Array(buffer) });
  await parser.load();
  const numPages = parser.doc?.numPages;
  const result = await parser.getText();
  const pages = result?.pages || [];
  const text = pages.map((p: { text: string }) => p.text).join('\n');
  parser.destroy();
  return { text: text.trim(), pageCount: numPages || pages.length };
}

async function extractDOCX(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value.trim() };
}

function extractSpreadsheet(buffer: Buffer): ExtractionResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const lines: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    lines.push(`--- Sheet: ${sheetName} ---\n${csv}`);
  }
  return { text: lines.join('\n\n').trim() };
}

function extractCSV(buffer: Buffer): ExtractionResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return { text: csv.trim() };
}

async function extractPPTX(buffer: Buffer): Promise<ExtractionResult> {
  const zip = await JSZip.loadAsync(buffer);
  const slideTexts: string[] = [];

  // PPTX slides are stored as ppt/slides/slide1.xml, slide2.xml, etc.
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async('text');
    // Extract text between <a:t> tags
    const textMatches = xml.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
    const texts = textMatches.map(m => m.replace(/<\/?a:t>/g, '').trim()).filter(Boolean);
    if (texts.length > 0) {
      const slideNum = slideFile.match(/slide(\d+)/)?.[1] || '?';
      slideTexts.push(`--- Slide ${slideNum} ---\n${texts.join(' ')}`);
    }
  }

  return { text: slideTexts.join('\n\n').trim(), pageCount: slideFiles.length };
}

/**
 * Fetch and extract text from a URL
 */
export async function extractFromURL(url: string): Promise<ExtractionResult> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Program Review Bot)' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove script, style, nav, footer elements
  $('script, style, nav, footer, header, aside, iframe, noscript').remove();

  const text = $('body').text()
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { text };
}
