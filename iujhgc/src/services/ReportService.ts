import type { LegislationEntry } from './LegislationService';
import type { ComplianceIssue } from './PdfService';

export interface ReportWarningItem {
  key: string;
  entry: LegislationEntry;
  issue: ComplianceIssue;
  score: number;
  matchedKeywords: string[];
}
