/**
 * PDF download and text extraction utility
 */

import { PDFParse } from 'pdf-parse';
import { fetchBuffer } from './fetch-html';
import { normalizeParagraphs } from './normalize';

export interface PDFContent {
  text: string;
  numPages: number;
  title?: string;
}

/**
 * Download a PDF from a URL and extract its text content
 */
export async function extractPdfFromUrl(url: string): Promise<PDFContent> {
  console.log(`  Downloading PDF: ${url}`);
  const buffer = await fetchBuffer(url);
  return extractPdfFromBuffer(buffer);
}

/**
 * Extract text from a PDF buffer
 */
export async function extractPdfFromBuffer(buffer: Buffer): Promise<PDFContent> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();

    return {
      text: normalizeParagraphs(textResult.text),
      numPages: textResult.total,
      title: infoResult.info?.Title || undefined,
    };
  } finally {
    await parser.destroy();
  }
}
