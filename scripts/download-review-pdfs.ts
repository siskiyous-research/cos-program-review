/**
 * Download all scraped review PDFs and organize them into
 * public/reviews/{category}/{program-slug}/ directory structure
 * matching the PROGRAM_LIST sidebar layout.
 */

import * as fs from 'fs';
import * as path from 'path';
import https from 'https';
import http from 'http';

const PROGRAM_LIST = {
  instructional: [
    'Alcohol & Drug Studies (ADHS)',
    'Administration of Justice',
    'Business and Computer Sciences',
    'Early Childhood Education',
    'Emergency Medical Services (EMS)',
    'Fine and Performing Arts',
    'Fire',
    'Health, Physical Education and Recreation',
    'Humanities and Social Sciences',
    'Math',
    'Modern Languages',
    'Non-Credit',
    'Nursing',
    'Sciences',
    'Welding',
  ],
  academicAffairs: [
    'Academic Affairs Division',
    'Academic Success Center (ASC)',
    'Distance Learning',
    'FIELD Program (ISA)',
    'Dual Enrollment',
    'Library',
  ],
  presidentsOffice: [
    "President's Office",
    'Human Resources',
    'Institutional Research',
    'Public Information Office',
  ],
  administrativeServices: [
    'Administrative Services Division',
    'Bookstore',
    'Fiscal Services',
    'Food Services',
    'Maintenance, Operations & Transportation',
    'Technology Services',
  ],
  studentServices: [
    'Student Services Division',
    'Admissions and Records',
    'Financial Aid, Veterans and AB540',
    'Basecamp',
    'Student Equity & Achievement',
    'Student Housing',
    'Counseling & Advising - Transfer & Orientation',
    'Student Access Services',
    'Outreach & Retention',
    'Special Populations – EOPS, CARE CalWORKs, NextUP, TRIO',
    'Student Services – AB 19, Health Clinic, International Students, Mental Health',
    'Student Life',
  ],
};

// Extended keyword matching for better program identification
const KEYWORD_MAP: Record<string, string> = {
  // Instructional
  'adhs': 'Alcohol & Drug Studies (ADHS)',
  'alcohol': 'Alcohol & Drug Studies (ADHS)',
  'drug studies': 'Alcohol & Drug Studies (ADHS)',
  'adj': 'Administration of Justice',
  'administration of justice': 'Administration of Justice',
  'admin justice': 'Administration of Justice',
  'business': 'Business and Computer Sciences',
  'computer science': 'Business and Computer Sciences',
  'ece': 'Early Childhood Education',
  'early childhood': 'Early Childhood Education',
  'ems': 'Emergency Medical Services (EMS)',
  'emergency medical': 'Emergency Medical Services (EMS)',
  'paramedic': 'Emergency Medical Services (EMS)',
  'fine arts': 'Fine and Performing Arts',
  'performing arts': 'Fine and Performing Arts',
  'music': 'Fine and Performing Arts',
  'theater': 'Fine and Performing Arts',
  'theatre': 'Fine and Performing Arts',
  'fire': 'Fire',
  'fire technology': 'Fire',
  'fire science': 'Fire',
  'hper': 'Health, Physical Education and Recreation',
  'hpek': 'Health, Physical Education and Recreation',
  'hpeak': 'Health, Physical Education and Recreation',
  'physical education': 'Health, Physical Education and Recreation',
  'athletics': 'Health, Physical Education and Recreation',
  'kinesiology': 'Health, Physical Education and Recreation',
  'humanities': 'Humanities and Social Sciences',
  'social sciences': 'Humanities and Social Sciences',
  'soc sci': 'Humanities and Social Sciences',
  'english': 'Humanities and Social Sciences',
  'coms': 'Humanities and Social Sciences',
  'communication': 'Humanities and Social Sciences',
  'math': 'Math',
  'mathematics': 'Math',
  'modern language': 'Modern Languages',
  'mlan': 'Modern Languages',
  'nursing': 'Nursing',
  'lvn': 'Nursing',
  'rn': 'Nursing',
  'cna': 'Nursing',
  'vocational nurs': 'Nursing',
  'vn program': 'Nursing',
  'bio and env': 'Sciences',
  'biology': 'Sciences',
  'chemistry': 'Sciences',
  'physics': 'Sciences',
  'engineering': 'Sciences',
  'environmental': 'Sciences',
  'geography': 'Sciences',
  'astro': 'Sciences',
  'astronomy': 'Sciences',
  'science': 'Sciences',
  'welding': 'Welding',
  // Academic Affairs
  'library': 'Library',
  'field': 'FIELD Program (ISA)',
  'distance learning': 'Distance Learning',
  'dual enrollment': 'Dual Enrollment',
  // Presidents Office
  'president': "President's Office",
  // Student Services
  'counseling': 'Counseling & Advising - Transfer & Orientation',
  'advising': 'Counseling & Advising - Transfer & Orientation',
  'financial aid': 'Financial Aid, Veterans and AB540',
  'bookstore': 'Bookstore',
  'housing': 'Student Housing',
};

function matchProgram(title: string): string | undefined {
  const lower = title.toLowerCase();

  // Exact program name match first
  const allPrograms = Object.values(PROGRAM_LIST).flat();
  for (const prog of allPrograms) {
    if (lower.includes(prog.toLowerCase())) return prog;
  }

  // Keyword match (longer keywords first for specificity)
  const sortedKeywords = Object.entries(KEYWORD_MAP)
    .sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, program] of sortedKeywords) {
    if (lower.includes(keyword)) return program;
  }

  return undefined;
}

function getProgramCategory(programName: string): string {
  for (const [cat, programs] of Object.entries(PROGRAM_LIST)) {
    if ((programs as string[]).includes(programName)) return cat;
  }
  return 'unmatched';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(dest);
          return downloadFile(redirectUrl, dest).then(resolve).catch(reject);
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });

    request.setTimeout(30000, () => {
      request.destroy();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(new Error('Download timeout'));
    });
  });
}

interface ReviewEntry {
  title: string;
  program?: string;
  programCategory?: string;
  year?: number;
  reviewType: string;
  url: string;
}

async function main() {
  const indexPath = path.join(process.cwd(), 'data', 'reviews', 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const reviews: ReviewEntry[] = index.reviews;

  const baseDir = path.join(process.cwd(), 'public', 'reviews');
  fs.mkdirSync(baseDir, { recursive: true });

  const seenUrls = new Set<string>();
  const manifest: Record<string, { program: string; category: string; files: { title: string; year: number; type: string; filename: string }[] }> = {};
  let downloaded = 0;
  let skipped = 0;

  console.log(`Downloading ${reviews.length} review PDFs...\n`);

  for (let i = 0; i < reviews.length; i++) {
    const review = reviews[i];

    // Deduplicate
    if (seenUrls.has(review.url)) {
      console.log(`  [${i + 1}/${reviews.length}] SKIP duplicate: ${review.title}`);
      skipped++;
      continue;
    }
    seenUrls.add(review.url);

    // Match program (re-match with improved keywords)
    const program = review.program || matchProgram(review.title) || matchProgram(review.url);
    const category = program ? getProgramCategory(program) : 'unmatched';
    const programSlug = program ? slugify(program) : 'unmatched';

    // Create directory
    const dir = path.join(baseDir, category, programSlug);
    fs.mkdirSync(dir, { recursive: true });

    // Extract filename from URL
    const urlPath = decodeURIComponent(new URL(review.url).pathname);
    let filename = path.basename(urlPath);
    // Clean up filename
    if (!filename.endsWith('.pdf')) filename += '.pdf';

    const dest = path.join(dir, filename);

    console.log(`  [${i + 1}/${reviews.length}] ${program || 'UNMATCHED'} → ${category}/${programSlug}/${filename}`);

    try {
      await downloadFile(review.url, dest);
      downloaded++;

      // Track in manifest
      const key = `${category}/${programSlug}`;
      if (!manifest[key]) {
        manifest[key] = { program: program || 'Unmatched', category, files: [] };
      }
      manifest[key].files.push({
        title: review.title,
        year: review.year || 0,
        type: review.reviewType,
        filename,
      });
    } catch (err) {
      console.error(`    ERROR: ${err instanceof Error ? err.message : err}`);
    }
  }

  // Write manifest
  fs.writeFileSync(
    path.join(baseDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\nDone! Downloaded ${downloaded} PDFs, skipped ${skipped} duplicates.`);

  // Summary by program
  console.log('\nFiles by program:');
  for (const [key, data] of Object.entries(manifest).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${key}: ${data.files.length} file(s)`);
  }
}

main().catch(console.error);
