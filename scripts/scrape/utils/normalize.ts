/**
 * Text normalization utilities for scraped content
 */

/** Collapse multiple whitespace/newlines into single spaces, trim */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Remove HTML entities and decode common ones */
export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '');
}

/** Remove non-printable characters */
export function stripNonPrintable(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/** Full normalization pipeline */
export function normalize(text: string): string {
  let result = decodeEntities(text);
  result = stripNonPrintable(result);
  result = normalizeWhitespace(result);
  return result;
}

/** Normalize preserving paragraph breaks (double newlines) */
export function normalizeParagraphs(text: string): string {
  let result = decodeEntities(text);
  result = stripNonPrintable(result);
  // Normalize runs of 3+ newlines to double newline
  result = result.replace(/\n{3,}/g, '\n\n');
  // Normalize spaces within lines (but keep newlines)
  result = result.replace(/[^\S\n]+/g, ' ');
  // Trim each line
  result = result
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
  return result.trim();
}

/** Generate a URL-safe slug from a title */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
