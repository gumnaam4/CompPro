import type { ReportPayload } from '../reportPayloadStorage';
import type { ReportWarningItem } from './ReportService';

const API_BASE = 'http://localhost:5000';

export function buildFallbackActionPlan(items: ReportWarningItem[]): string {
  const lines: string[] = [
    'Recommended actions (summary from selected issues — AI unavailable):',
    '',
  ];
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.entry.title}`);
    lines.push(`   ${item.issue.suggestedAction}`);
    lines.push('');
  });
  return lines.join('\n').trim();
}

export async function fetchReportActionPlan(payload: ReportPayload): Promise<string> {
  const body = {
    items: payload.items.map(i => ({
      key: i.key,
      legislationTitle: i.entry.title,
      category: i.issue.category,
      severity: i.issue.severity,
      type: i.issue.type,
      description: i.issue.description,
      suggestedAction: i.issue.suggestedAction,
      legislationReference: i.issue.legislationReference,
    })),
    companyDetails: payload.companyDetails,
    pdfFileName: payload.pdfFileName,
    generatedAt: payload.generatedAt,
  };

  const res = await fetch(`${API_BASE}/api/report-action-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }

  const data = (await res.json()) as { text: string };
  if (!data.text?.trim()) {
    throw new Error('Empty response');
  }
  return data.text.trim();
}
