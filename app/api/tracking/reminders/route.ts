import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSetting } from '@/lib/settings';
import { getCurrentAcademicYear, INSTRUCTIONAL_SCHEDULE, NON_INSTRUCTIONAL_SCHEDULE } from '@/lib/tracking-schedule';

export async function GET() {
  const supabase = await createClient();
  const year = getCurrentAcademicYear();

  const deanEmails = await getSetting('dean_emails') || '';
  const vpEmails = await getSetting('vp_emails') || '';

  // Get all engagement data for current year
  const { data: engagements } = await supabase
    .from('pr_engagement_log')
    .select('program_name, engagement_type')
    .eq('academic_year', year);

  const engagementMap = new Map<string, { count: number; submitted: boolean; presented: boolean }>();
  for (const e of engagements || []) {
    const existing = engagementMap.get(e.program_name) || { count: 0, submitted: false, presented: false };
    existing.count++;
    if (e.engagement_type === 'submitted') existing.submitted = true;
    if (e.engagement_type === 'presented') existing.presented = true;
    engagementMap.set(e.program_name, existing);
  }

  function getStatus(name: string): string {
    const e = engagementMap.get(name);
    if (!e) return 'red';
    if (e.presented) return 'presented';
    if (e.submitted) return 'submitted';
    if (e.count > 0) return 'yellow';
    return 'red';
  }

  function statusLabel(s: string): string {
    switch (s) {
      case 'red': return 'Needs Follow-up';
      case 'yellow': return 'Engaged';
      case 'submitted': return 'Submitted';
      case 'presented': return 'Presented';
      default: return s;
    }
  }

  function statusColor(s: string): string {
    switch (s) {
      case 'red': return '#fee2e2';
      case 'yellow': return '#fef9c3';
      case 'submitted': return '#dcfce7';
      case 'presented': return '#bbf7d0';
      default: return '#f1f5f9';
    }
  }

  function buildHtml(programs: typeof INSTRUCTIONAL_SCHEDULE, title: string): string {
    const rows = programs
      .filter(p => p.years[year])
      .map(p => {
        const status = getStatus(p.name);
        const reviewType = p.years[year];
        return `<tr>
          <td style="padding:8px;border:1px solid #e2e8f0;">${p.name}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${reviewType}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;background:${statusColor(status)};">${statusLabel(status)}</td>
        </tr>`;
      })
      .join('');

    const needsAttention = programs
      .filter(p => p.years[year])
      .filter(p => getStatus(p.name) === 'red').length;

    return `
      <div style="font-family:Segoe UI,sans-serif;max-width:700px;margin:0 auto;">
        <h2 style="color:#1e3a8a;">${title} — ${year}</h2>
        <p style="color:#64748b;margin-bottom:16px;">
          ${needsAttention > 0 ? `<strong style="color:#dc2626;">${needsAttention} program(s) need follow-up.</strong>` : '<strong style="color:#16a34a;">All programs are on track.</strong>'}
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Program</th>
              <th style="padding:8px;border:1px solid #e2e8f0;text-align:center;width:80px;">Type</th>
              <th style="padding:8px;border:1px solid #e2e8f0;text-align:center;width:120px;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#94a3b8;font-size:12px;margin-top:16px;">
          PR = Comprehensive Program Review | AU = Annual Update<br/>
          This is an automated reminder from the Program Review Tracking System.
        </p>
      </div>
    `;
  }

  const instructionalHtml = buildHtml(INSTRUCTIONAL_SCHEDULE, 'Instructional Program Review Status');
  const nonInstructionalHtml = buildHtml(NON_INSTRUCTIONAL_SCHEDULE, 'Non-Instructional Program Review Status');

  return NextResponse.json({
    deanEmails,
    vpEmails,
    instructionalHtml,
    nonInstructionalHtml,
    year,
  });
}
