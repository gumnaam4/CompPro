export interface ComplianceRequirement {
  id: string;
  category: string;
  title: string;
  description: string;
  mandatory: boolean;
  keywords: string[];
  relatedDocuments: string[];
}

export interface CompanyAnalysis {
  companyType: string;
  sector: string;
  confidence: number;
  detectedRequirements: ComplianceRequirement[];
  missingRequirements: ComplianceRequirement[];
  complianceScore: number;
}

export interface CompanyDetails {
  companyType: string;
  sector: string;
  taxStatus: string;
  vatStatus: string;
  employeeStatus: string;
  websitePresence: string;
}

export interface ComplianceCheckResult {
  analysis: CompanyAnalysis;
  recommendations: string[];
  relatedLegislation: string[];
}

// UK Company Compliance Requirements Database
const COMPLIANCE_REQUIREMENTS: ComplianceRequirement[] = [
  // Company Registration
  {
    id: 'company_registration',
    category: 'Registration',
    title: 'Company Registration with Companies House',
    description: 'Companies in the UK are registered with Companies House. Requirements include unique company name, registered office address in UK, at least one director, shareholders, Memorandum of Association, and Articles of Association.',
    mandatory: true,
    keywords: ['companies house', 'certificate of incorporation', 'memorandum', 'articles', 'registered office', 'director', 'shareholder'],
    relatedDocuments: ['Companies Act 2006', 'Company Formation Documents']
  },
  // Tax Registration
  {
    id: 'corporation_tax',
    category: 'Tax',
    title: 'Corporation Tax Registration',
    description: 'Register for Corporation Tax with HMRC within 3 months of starting business.',
    mandatory: true,
    keywords: ['hmrc', 'corporation tax', 'tax registration', 'ct600'],
    relatedDocuments: ['Corporation Tax Act 2010', 'HMRC Registration Guidelines']
  },
  {
    id: 'vat_registration',
    category: 'Tax',
    title: 'VAT Registration',
    description: 'Register for VAT if turnover exceeds £90,000.',
    mandatory: false,
    keywords: ['vat', 'value added tax', 'vat registration', 'turnover'],
    relatedDocuments: ['Value Added Tax Act 1994', 'VAT Registration Threshold']
  },
  {
    id: 'paye_registration',
    category: 'Tax',
    title: 'PAYE Registration',
    description: 'Register for PAYE if hiring employees.',
    mandatory: false,
    keywords: ['paye', 'payroll', 'employees', 'p45', 'p60'],
    relatedDocuments: ['Income Tax (Earnings and Pensions) Act 2003', 'PAYE Regulations']
  },
  // Financial Compliance
  {
    id: 'accounting_records',
    category: 'Financial',
    title: 'Maintain Accounting Records',
    description: 'Keep proper financial records including income, expenses, assets, and liabilities.',
    mandatory: true,
    keywords: ['accounting records', 'financial records', 'books', 'ledgers'],
    relatedDocuments: ['Companies Act 2006 Section 386', 'Accounting Standards']
  },
  {
    id: 'annual_accounts',
    category: 'Financial',
    title: 'File Annual Accounts',
    description: 'File annual accounts with Companies House within 9 months of accounting reference date.',
    mandatory: true,
    keywords: ['annual accounts', 'companies house filing', 'confirmation statement'],
    relatedDocuments: ['Companies Act 2006', 'Financial Reporting Standards']
  },
  {
    id: 'corporation_tax_return',
    category: 'Financial',
    title: 'Submit Corporation Tax Return',
    description: 'Submit Corporation Tax Return to HMRC within 12 months of accounting period end.',
    mandatory: true,
    keywords: ['corporation tax return', 'ct600', 'hmrc filing'],
    relatedDocuments: ['Corporation Tax Act 2010', 'CT600 Guidance']
  },
  // Data Protection
  {
    id: 'gdpr_compliance',
    category: 'Data Protection',
    title: 'UK GDPR Compliance',
    description: 'Comply with UK General Data Protection Regulation and Data Protection Act 2018 if processing personal data.',
    mandatory: false,
    keywords: ['gdpr', 'data protection', 'personal data', 'privacy', 'ico'],
    relatedDocuments: ['UK GDPR', 'Data Protection Act 2018', 'ICO Guidelines']
  },
  {
    id: 'ico_registration',
    category: 'Data Protection',
    title: 'ICO Registration',
    description: 'Register with Information Commissioner\'s Office if processing personal data.',
    mandatory: false,
    keywords: ['ico', 'information commissioner', 'data controller', 'data processor'],
    relatedDocuments: ['Data Protection Act 2018', 'ICO Registration Process']
  },
  // Website Policies
  {
    id: 'privacy_policy',
    category: 'Legal Policies',
    title: 'Privacy Policy',
    description: 'Publish a privacy policy explaining how personal data is collected, used, and protected.',
    mandatory: false,
    keywords: ['privacy policy', 'data collection', 'data usage', 'cookies'],
    relatedDocuments: ['UK GDPR', 'ICO Privacy Policy Guidance']
  },
  {
    id: 'terms_conditions',
    category: 'Legal Policies',
    title: 'Terms and Conditions',
    description: 'Provide terms and conditions for website/app usage.',
    mandatory: false,
    keywords: ['terms and conditions', 'terms of service', 'user agreement'],
    relatedDocuments: ['Consumer Contracts Regulations 2013', 'Electronic Commerce Regulations']
  },
  {
    id: 'cookie_policy',
    category: 'Legal Policies',
    title: 'Cookie Policy',
    description: 'Explain cookie usage and obtain user consent.',
    mandatory: false,
    keywords: ['cookie policy', 'cookies', 'tracking', 'consent'],
    relatedDocuments: ['Privacy and Electronic Communications Regulations 2003']
  },
  // Employment
  {
    id: 'employment_contracts',
    category: 'Employment',
    title: 'Employment Contracts',
    description: 'Provide written employment contracts to all employees.',
    mandatory: true,
    keywords: ['employment contract', 'contract of employment', 'written statement'],
    relatedDocuments: ['Employment Rights Act 1996', 'Employment Contracts']
  },
  {
    id: 'minimum_wage',
    category: 'Employment',
    title: 'Minimum Wage Compliance',
    description: 'Pay at least the National Minimum Wage or National Living Wage.',
    mandatory: true,
    keywords: ['minimum wage', 'living wage', 'pay rates'],
    relatedDocuments: ['National Minimum Wage Act 1998', 'National Living Wage']
  },
  {
    id: 'workplace_pension',
    category: 'Employment',
    title: 'Workplace Pension Scheme',
    description: 'Auto-enrol employees into workplace pension scheme.',
    mandatory: true,
    keywords: ['pension', 'auto-enrolment', 'workplace pension'],
    relatedDocuments: ['Pensions Act 2008', 'Pensions Regulator Guidance']
  }
];

// Company Type and Sector Detection
const COMPANY_TYPES = {
  'limited company': { type: 'Private Limited Company', sector: 'General Business', keywords: ['ltd', 'limited', 'private limited'] },
  'public limited company': { type: 'Public Limited Company', sector: 'General Business', keywords: ['plc', 'public limited'] },
  'charity': { type: 'Charitable Company', sector: 'Non-Profit', keywords: ['charity', 'charitable', 'not for profit'] },
  'community interest company': { type: 'Community Interest Company', sector: 'Social Enterprise', keywords: ['cic', 'community interest'] },
  'startup': { type: 'Private Limited Company', sector: 'Technology/Startup', keywords: ['startup', 'tech', 'software', 'app', 'digital'] },
  'financial services': { type: 'Private Limited Company', sector: 'Financial Services', keywords: ['bank', 'finance', 'investment', 'insurance', 'financial'] },
  'healthcare': { type: 'Private Limited Company', sector: 'Healthcare', keywords: ['health', 'medical', 'care', 'clinic', 'hospital'] },
  'food business': { type: 'Private Limited Company', sector: 'Food & Hospitality', keywords: ['restaurant', 'food', 'catering', 'cafe', 'pub'] },
  'retail': { type: 'Private Limited Company', sector: 'Retail', keywords: ['shop', 'store', 'retail', 'ecommerce'] },
  'construction': { type: 'Private Limited Company', sector: 'Construction', keywords: ['building', 'construction', 'contractor'] },
  'education': { type: 'Private Limited Company', sector: 'Education', keywords: ['school', 'education', 'training', 'academy'] }
};

/**
 * Analyze PDF content to identify company type and sector
 */
export function analyzeCompanyType(pdfText: string): { type: string; sector: string; confidence: number } {
  const text = pdfText.toLowerCase();
  let bestMatch = { type: 'Private Limited Company', sector: 'General Business', confidence: 0 };

  for (const [key, info] of Object.entries(COMPANY_TYPES)) {
    let score = 0;
    for (const keyword of info.keywords) {
      if (text.includes(keyword)) {
        score += 1;
      }
    }
    const confidence = score / info.keywords.length;
    if (confidence > bestMatch.confidence) {
      bestMatch = { ...info, confidence };
    }
  }

  return bestMatch;
}

/**
 * Check compliance of PDF content against requirements
 */
export function checkCompliance(pdfText: string, keywords: string[], details?: CompanyDetails): ComplianceCheckResult {
  const text = pdfText.toLowerCase();
  const detailText = details ? Object.values(details).join(' ').toLowerCase() : '';
  const detectedRequirements: ComplianceRequirement[] = [];
  const missingRequirements: ComplianceRequirement[] = [];

  // Check each requirement
  for (const requirement of COMPLIANCE_REQUIREMENTS) {
    let matches = 0;
    for (const keyword of requirement.keywords) {
      if (text.includes(keyword.toLowerCase()) ||
          detailText.includes(keyword.toLowerCase()) ||
          keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))) {
        matches += 1;
      }
    }

    const complianceRatio = matches / requirement.keywords.length;
    if (complianceRatio >= 0.5) { // 50% keyword match threshold
      detectedRequirements.push(requirement);
    } else {
      missingRequirements.push(requirement);
    }
  }

  // Calculate compliance score
  const totalRequirements = COMPLIANCE_REQUIREMENTS.length;
  const mandatoryRequirements = COMPLIANCE_REQUIREMENTS.filter(r => r.mandatory);
  const detectedMandatory = detectedRequirements.filter(r => r.mandatory);

  const complianceScore = Math.round(
    (detectedRequirements.length / totalRequirements) * 100
  );

  const analysis: CompanyAnalysis = {
    ...analyzeCompanyType(pdfText),
    detectedRequirements,
    missingRequirements,
    complianceScore
  };

  // Generate recommendations
  const recommendations = generateRecommendations(missingRequirements, analysis);

  // Find related legislation
  const relatedLegislation = findRelatedLegislation(detectedRequirements, missingRequirements);

  return {
    analysis,
    recommendations,
    relatedLegislation
  };
}

/**
 * Generate compliance recommendations based on missing requirements
 */
function generateRecommendations(missingRequirements: ComplianceRequirement[], analysis: CompanyAnalysis): string[] {
  const recommendations: string[] = [];

  // Prioritize mandatory missing requirements
  const mandatoryMissing = missingRequirements.filter(r => r.mandatory);
  const optionalMissing = missingRequirements.filter(r => !r.mandatory);

  if (mandatoryMissing.length > 0) {
    recommendations.push(`URGENT: Address ${mandatoryMissing.length} mandatory compliance requirements:`);
    mandatoryMissing.forEach(req => {
      recommendations.push(`• ${req.title}: ${req.description}`);
    });
  }

  if (optionalMissing.length > 0) {
    recommendations.push(`\nConsider these optional requirements for ${analysis.sector} companies:`);
    optionalMissing.slice(0, 3).forEach(req => { // Limit to top 3
      recommendations.push(`• ${req.title}`);
    });
  }

  // Sector-specific recommendations
  if (analysis.sector === 'Technology/Startup') {
    recommendations.push('\nTech/Startup specific: Ensure GDPR compliance and consider patent protection for IP.');
  } else if (analysis.sector === 'Financial Services') {
    recommendations.push('\nFinancial Services: Check FCA authorization requirements.');
  } else if (analysis.sector === 'Healthcare') {
    recommendations.push('\nHealthcare: Verify CQC registration requirements.');
  }

  return recommendations;
}

/**
 * Find related legislation based on detected and missing requirements
 */
function findRelatedLegislation(detected: ComplianceRequirement[], missing: ComplianceRequirement[]): string[] {
  const allRequirements = [...detected, ...missing];
  const legislation = new Set<string>();

  allRequirements.forEach(req => {
    req.relatedDocuments.forEach(doc => legislation.add(doc));
  });

  return Array.from(legislation);
}