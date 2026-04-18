import type { CompanyDetails } from './services/ComplianceService';
import type { ReportWarningItem } from './services/ReportService';

export interface ReportPayload {
  items: ReportWarningItem[];
  companyDetails: CompanyDetails;
  pdfFileName: string;
  generatedAt: string;
}

const PREFIX = 'legislation-portal-report:';

export function stashReportPayload(payload: ReportPayload): string {
  const id = crypto.randomUUID();
  localStorage.setItem(PREFIX + id, JSON.stringify(payload));
  return id;
}

export function loadReportPayload(id: string): ReportPayload | null {
  const raw = localStorage.getItem(PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReportPayload;
  } catch {
    return null;
  }
}
