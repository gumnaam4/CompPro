import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Use the locally-bundled worker — no CDN required
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

/** Extract all text from a PDF File object */
export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageStr = content.items
      .map((item: any) => item.str)
      .join(' ');
    pageTexts.push(pageStr);
  }

  return pageTexts.join('\n\n');
}

/** Tokenise text into meaningful words (3+ chars, no stop words) */
const STOP_WORDS = new Set([
  'the','and','for','are','but','not','you','all','can','had','her','was',
  'one','our','out','day','get','has','him','his','how','its','may','new',
  'now','old','see','two','way','use','with','that','this','from','they',
  'will','have','been','more','than','when','who','what','which','their',
  'were','said','each','about','into','other','could','time','also','these',
  'any','she','him','him','per','act','law','section','shall','under','where'
]);

function tokenise(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w))
  );
}

export interface ComparisonResult {
  score: number;          // 0–100
  matchedKeywords: string[];
  topicOverlap: string[];
  complianceIssues: ComplianceIssue[];
  recommendations: string[];
}

export interface ComplianceIssue {
  type: 'missing' | 'incomplete' | 'outdated' | 'conflicting';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  legislationReference: string;
  suggestedAction: string;
}

/** Compare PDF text against a piece of legislation text */
export function comparePdfToLegislation(
  pdfText: string,
  legTitle: string,
  legSummary: string
): ComparisonResult {
  const pdfTokens = tokenise(pdfText);
  const legTokens = tokenise(`${legTitle} ${legSummary}`);

  const matched = [...pdfTokens].filter(t => legTokens.has(t));
  const score = legTokens.size > 0
    ? Math.min(100, Math.round((matched.length / legTokens.size) * 100))
    : 0;

  // Surface the most relevant matched keywords (top 8)
  const matchedKeywords = matched.slice(0, 8);

  // Analyze for compliance issues
  const complianceIssues = analyzeComplianceIssues(pdfText, legTitle, legSummary);
  const recommendations = generateComplianceRecommendations(complianceIssues, legTitle);

  return {
    score,
    matchedKeywords,
    topicOverlap: matchedKeywords,
    complianceIssues,
    recommendations
  };
}

/**
 * Analyze legislation content for potential compliance issues
 */
function analyzeComplianceIssues(pdfText: string, legTitle: string, legSummary: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];
  const pdfLower = pdfText.toLowerCase();
  const legLower = `${legTitle} ${legSummary}`.toLowerCase();

  // Data Protection & Privacy Issues
  if (legLower.includes('data protection') || legLower.includes('gdpr') || legLower.includes('privacy')) {
    if (!pdfLower.includes('privacy policy') && !pdfLower.includes('data protection')) {
      issues.push({
        type: 'missing',
        severity: 'high',
        category: 'Data Protection',
        description: 'Privacy policy or data protection statement not found in document',
        legislationReference: legTitle,
        suggestedAction: 'Add a comprehensive privacy policy compliant with UK GDPR'
      });
    }

    if (!pdfLower.includes('consent') && legLower.includes('consent')) {
      issues.push({
        type: 'missing',
        severity: 'medium',
        category: 'Data Protection',
        description: 'User consent mechanisms not documented',
        legislationReference: legTitle,
        suggestedAction: 'Document how user consent is obtained and managed'
      });
    }
  }

  // Employment & HR Issues
  if (legLower.includes('employment') || legLower.includes('worker') || legLower.includes('employee')) {
    if (!pdfLower.includes('contract') && !pdfLower.includes('employment terms')) {
      issues.push({
        type: 'missing',
        severity: 'high',
        category: 'Employment',
        description: 'Employment contracts or terms not documented',
        legislationReference: legTitle,
        suggestedAction: 'Ensure all employees have written employment contracts'
      });
    }

    if (legLower.includes('pension') && !pdfLower.includes('pension') && !pdfLower.includes('auto-enrolment')) {
      issues.push({
        type: 'missing',
        severity: 'medium',
        category: 'Employment',
        description: 'Workplace pension scheme compliance not addressed',
        legislationReference: legTitle,
        suggestedAction: 'Implement auto-enrolment workplace pension scheme'
      });
    }
  }

  // Financial & Tax Issues
  if (legLower.includes('tax') || legLower.includes('financial') || legLower.includes('accounting')) {
    if (!pdfLower.includes('accounting records') && legLower.includes('records')) {
      issues.push({
        type: 'missing',
        severity: 'high',
        category: 'Financial',
        description: 'Accounting records maintenance not documented',
        legislationReference: legTitle,
        suggestedAction: 'Establish proper accounting record keeping procedures'
      });
    }

    if (legLower.includes('annual accounts') && !pdfLower.includes('annual accounts') && !pdfLower.includes('financial statements')) {
      issues.push({
        type: 'missing',
        severity: 'high',
        category: 'Financial',
        description: 'Annual accounts filing requirements not addressed',
        legislationReference: legTitle,
        suggestedAction: 'File annual accounts with Companies House within required timeframe'
      });
    }
  }

  // Company Registration & Governance
  if (legLower.includes('registration') || legLower.includes('incorporation') || legLower.includes('companies house')) {
    if (!pdfLower.includes('certificate of incorporation') && !pdfLower.includes('companies house')) {
      issues.push({
        type: 'missing',
        severity: 'critical',
        category: 'Company Registration',
        description: 'Company registration with Companies House not confirmed',
        legislationReference: legTitle,
        suggestedAction: 'Register company with Companies House and obtain Certificate of Incorporation'
      });
    }

    if (legLower.includes('director') && !pdfLower.includes('director') && !pdfLower.includes('board')) {
      issues.push({
        type: 'missing',
        severity: 'high',
        category: 'Governance',
        description: 'Director responsibilities and appointments not documented',
        legislationReference: legTitle,
        suggestedAction: 'Appoint qualified directors and document their responsibilities'
      });
    }
  }

  // Health & Safety (if applicable)
  if (legLower.includes('health') || legLower.includes('safety') || legLower.includes('workplace')) {
    if (!pdfLower.includes('risk assessment') && legLower.includes('risk')) {
      issues.push({
        type: 'missing',
        severity: 'medium',
        category: 'Health & Safety',
        description: 'Workplace risk assessments not documented',
        legislationReference: legTitle,
        suggestedAction: 'Conduct and document workplace risk assessments'
      });
    }
  }

  return issues;
}

/**
 * Generate actionable recommendations based on compliance issues
 */
function generateComplianceRecommendations(issues: ComplianceIssue[], legislationTitle: string): string[] {
  const recommendations: string[] = [];

  if (issues.length === 0) {
    recommendations.push(`✅ Document appears compliant with ${legislationTitle}`);
    return recommendations;
  }

  // Group issues by severity
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');
  const mediumIssues = issues.filter(i => i.severity === 'medium');

  if (criticalIssues.length > 0) {
    recommendations.push(`🚨 CRITICAL: Address ${criticalIssues.length} critical compliance issue(s) immediately:`);
    criticalIssues.forEach(issue => recommendations.push(`• ${issue.description}`));
  }

  if (highIssues.length > 0) {
    recommendations.push(`⚠️ HIGH PRIORITY: Address ${highIssues.length} high-priority issue(s):`);
    highIssues.forEach(issue => recommendations.push(`• ${issue.description}`));
  }

  if (mediumIssues.length > 0) {
    recommendations.push(`ℹ️ CONSIDER: Review ${mediumIssues.length} additional compliance area(s):`);
    mediumIssues.slice(0, 3).forEach(issue => recommendations.push(`• ${issue.description}`));
  }

  // Add general recommendation
  recommendations.push(`📋 Review full requirements in: ${legislationTitle}`);

  return recommendations;
}
