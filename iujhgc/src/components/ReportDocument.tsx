import React from 'react';
import type { ReportWarningItem } from '../services/ReportService';
import type { CompanyDetails } from '../services/ComplianceService';

function severityClass(severity: string): string {
  return severity.toLowerCase();
}

function severityLabel(severity: string): string {
  const s = severity.toLowerCase();
  if (s === 'critical') return 'CRITICAL';
  if (s === 'high') return 'HIGH';
  if (s === 'medium') return 'MEDIUM';
  if (s === 'low') return 'LOW';
  return severity.toUpperCase();
}

interface ReportDocumentProps {
  items: ReportWarningItem[];
  companyDetails: CompanyDetails;
  pdfFileName: string;
  generatedAt: string;
  variant: 'screen' | 'print';
  aiPlanLoading?: boolean;
  aiPlanText?: string | null;
}

const reportStyles = `
  .rp-page { max-width: 980px; margin: 0 auto; padding: 24px; font-family: 'Source Sans 3', ui-sans-serif, system-ui, sans-serif; color: #d4d4d8; }
  .rp-header { padding: 24px; background: #18181b; color: #e4e4e7; border-radius: 0; border: 1px solid rgba(255,255,255,0.06); }
  .rp-header h1 { margin: 0 0 0.5rem; font-size: 2rem; font-weight: 700; letter-spacing: 0.02em; }
  .rp-header p { margin: 0; opacity: 0.75; color: #a1a1aa; }
  .rp-meta { margin-top: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
  .rp-meta-card { background: #0a0a0a; border-radius: 0; padding: 14px 16px; border: 1px solid rgba(255,255,255,0.06); }
  .rp-meta-card strong { display: block; margin-bottom: 0.45rem; color: #a1a1aa; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .rp-meta-card span { color: #d4d4d8; font-size: 0.95rem; }
  .rp-section { margin-top: 2rem; }
  .rp-section h2 { margin-bottom: 1rem; font-size: 1.2rem; color: #e4e4e7; font-weight: 600; }
  .rp-warning { margin-bottom: 1rem; padding: 1rem 1.25rem; background: #0a0a0a; border-radius: 0; border: 1px solid rgba(255,255,255,0.06); border-left: 3px solid #52525b; }
  .rp-warning-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 0.75rem; }
  .rp-cat { font-weight: 700; color: #e4e4e7; }
  .rp-sev { text-transform: uppercase; font-size: 0.74rem; font-weight: 700; padding: 4px 9px; border-radius: 0; color: #d4d4d8; }
  .rp-sev.low { background: #52525b; }
  .rp-sev.medium { background: #52525b; }
  .rp-sev.high { background: #3f3f46; }
  .rp-sev.critical { background: #27272a; }
  .rp-detail strong { color: #e4e4e7; }
  .rp-detail p { margin: 0.4rem 0; color: #a1a1aa; line-height: 1.6; }
  .rp-ai { margin-top: 2rem; padding: 1.25rem 1.35rem; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid #a1a1aa; }
  .rp-ai h2 { margin: 0 0 0.75rem; font-size: 1.15rem; color: #e4e4e7; font-weight: 600; }
  .rp-ai .rp-ai-body { margin: 0; color: #a1a1aa; font-size: 0.95rem; line-height: 1.65; white-space: pre-wrap; }
  .rp-ai .rp-ai-note { margin: 0.75rem 0 0; font-size: 0.82rem; color: #71717a; font-style: italic; }
  .rp-ai.rp-ai-loading { color: #71717a; }
  @media print {
    .rp-toolbar { display: none !important; }
    .rp-page { padding: 0; max-width: none; background: #fafafa !important; color: #18181b !important; }
    .rp-header { background: #27272a !important; color: #fafafa !important; border: none !important; }
    .rp-header p { color: #d4d4d8 !important; opacity: 1 !important; }
    .rp-meta-card { background: #fff !important; border: 1px solid #e4e4e7 !important; }
    .rp-meta-card strong { color: #52525b !important; }
    .rp-meta-card span { color: #18181b !important; }
    .rp-section h2 { color: #18181b !important; }
    .rp-warning { break-inside: avoid; background: #fff !important; border: 1px solid #e4e4e7 !important; border-left: 3px solid #71717a !important; }
    .rp-cat { color: #18181b !important; }
    .rp-detail strong { color: #18181b !important; }
    .rp-detail p { color: #52525b !important; }
    .rp-sev { color: #fafafa !important; }
    .rp-sev.low, .rp-sev.medium { background: #71717a !important; }
    .rp-sev.high { background: #52525b !important; }
    .rp-sev.critical { background: #3f3f46 !important; }
    .rp-ai { background: #fff !important; border: 1px solid #e4e4e7 !important; border-left: 3px solid #52525b !important; break-inside: avoid; }
    .rp-ai h2 { color: #18181b !important; }
    .rp-ai .rp-ai-body { color: #374151 !important; }
    .rp-ai .rp-ai-note { color: #6b7280 !important; }
  }
`;

export const ReportDocument: React.FC<ReportDocumentProps> = ({
  items,
  companyDetails,
  pdfFileName,
  generatedAt,
  variant,
  aiPlanLoading = false,
  aiPlanText = null,
}) => {
  const bg = variant === 'print' ? '#000000' : '#000000';
  const showAiBlock = items.length > 0;

  return (
    <>
      <style>{reportStyles}</style>
      <div className="rp-page" style={{ background: bg, minHeight: variant === 'print' ? '100vh' : undefined }}>
        <div className="rp-header">
          <h1>Compliance report</h1>
          <p>Selected warnings from your legislation review and document comparison.</p>
        </div>

        <div className="rp-meta">
          <div className="rp-meta-card">
            <strong>Generated</strong>
            <span>{new Date(generatedAt).toLocaleString()}</span>
          </div>
          <div className="rp-meta-card">
            <strong>Source PDF</strong>
            <span>{pdfFileName}</span>
          </div>
          <div className="rp-meta-card">
            <strong>Selected warnings</strong>
            <span>{items.length}</span>
          </div>
          <div className="rp-meta-card">
            <strong>Company context</strong>
            <span>
              {companyDetails.companyType} • {companyDetails.sector}
            </span>
          </div>
        </div>

        {showAiBlock && (
          <div className={`rp-ai${aiPlanLoading ? ' rp-ai-loading' : ''}`}>
            <h2>AI action plan</h2>
            {aiPlanLoading ? (
              <p className="rp-ai-body">Generating recommended actions for all selected issues…</p>
            ) : aiPlanText ? (
              <>
                <p className="rp-ai-body">{aiPlanText}</p>
                <p className="rp-ai-note">
                  This section is generated to help prioritise remediation. It does not constitute legal advice; confirm with qualified advisers where required.
                </p>
              </>
            ) : (
              <p className="rp-ai-body">No action narrative available.</p>
            )}
          </div>
        )}

        <div className="rp-section">
          <h2>Selected report warnings</h2>
          {items.length === 0 ? (
            <p style={{ color: '#71717a' }}>No warnings were included.</p>
          ) : (
            items.map(item => (
              <div key={item.key} className="rp-warning">
                <div className="rp-warning-head">
                  <span className="rp-cat">{item.issue.category}</span>
                  <span className={`rp-sev ${severityClass(item.issue.severity)}`}>
                    {severityLabel(item.issue.severity)}
                  </span>
                </div>
                <div className="rp-detail">
                  <strong>{item.entry.title}</strong>
                  <p>{item.issue.description}</p>
                  <p>
                    <strong>Suggested action:</strong> {item.issue.suggestedAction}
                  </p>
                  <p>
                    <strong>Reference:</strong> {item.issue.legislationReference}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
