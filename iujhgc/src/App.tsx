import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLatestLegislation, searchLegislation, type LegislationEntry } from './services/LegislationService';
import { comparePdfToLegislation, type ComparisonResult } from './services/PdfService';
import type { ReportWarningItem } from './services/ReportService';
import { stashReportPayload } from './reportPayloadStorage';
import { searchByMultipleKeywords } from './services/MultiKeywordSearchService';
import { checkCompliance, type ComplianceCheckResult } from './services/ComplianceService';
import SearchBar from './components/SearchBar';
import LegislationCard from './components/LegislationCard';
import DocumentViewer from './components/DocumentViewer';
import PdfUploader from './components/PdfUploader';
// import ComplianceChecker from './components/ComplianceChecker';
import {
  Sparkles, Database, LayoutGrid, List,
  FileSearch, ChevronDown, ChevronUp, SlidersHorizontal,
  Shield, FileCheck, FileDown
} from 'lucide-react';

interface CompanyDetails {
  companyType: string;
  sector: string;
  taxStatus: string;
  vatStatus: string;
  employeeStatus: string;
  websitePresence: string;
}

const initialCompanyDetails: CompanyDetails = {
  companyType: 'Private Limited Company',
  sector: 'General Business',
  taxStatus: 'Corporation Tax Registered',
  vatStatus: 'Not VAT Registered',
  employeeStatus: 'No Employees',
  websitePresence: 'Website / App',
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<LegislationEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEntry, setSelectedEntry] = useState<LegislationEntry | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // PDF state
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfPanelOpen, setPdfPanelOpen] = useState<boolean>(true);
  const [prioritizeErrors, setPrioritizeErrors] = useState<boolean>(false);

  // Company / compliance selectors
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>(initialCompanyDetails);

  const updateCompanyDetail = (field: keyof CompanyDetails, value: string) => {
    setCompanyDetails(prev => ({ ...prev, [field]: value }));
  };

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 0,
    padding: '0.75rem 0.85rem',
    fontSize: '0.95rem',
    outline: 'none',
  };

  // Compliance checking
  const [complianceResult, setComplianceResult] = useState<ComplianceCheckResult | null>(null);
  const [activeTab, setActiveTab] = useState<'legislation' | 'compliance'>('legislation');

  useEffect(() => { loadLatest(); }, []);

  const loadLatest = async () => {
    setLoading(true);
    const results = await fetchLatestLegislation();
    setData(results);
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) { loadLatest(); return; }
    setLoading(true);
    const results = await searchLegislation(query);
    setData(results);
    setLoading(false);
  };

  const handlePdfExtracted = (text: string, name: string) => {
    setPdfText(text);
    setPdfFileName(name);
    setPrioritizeErrors(true);
  };

  const getEnrichedKeywords = (keywords: string[]) => {
    return [
      ...keywords,
      companyDetails.companyType,
      companyDetails.sector,
      companyDetails.taxStatus,
      companyDetails.vatStatus,
      companyDetails.employeeStatus,
      companyDetails.websitePresence,
    ].filter(Boolean).map(k => k.toLowerCase());
  };

  const handleKeywordsExtracted = async (keywords: string[], topics: string[]) => {
    console.log('Keywords extracted:', keywords);
    console.log('Topics extracted:', topics);

    const enrichedKeywords = getEnrichedKeywords(keywords);

    // Perform compliance check if we have PDF text
    if (pdfText) {
      try {
        const compliance = checkCompliance(pdfText, enrichedKeywords, companyDetails);
        setComplianceResult(compliance);
        console.log('Compliance check completed:', compliance.analysis.complianceScore + '%');
      } catch (error) {
        console.error('Error in compliance check:', error);
      }
    }

    // Perform multi-keyword search
    if (enrichedKeywords.length > 0) {
      setLoading(true);
      try {
        const results = await searchByMultipleKeywords(enrichedKeywords, 20);
        setData(results);
        console.log('Multi-keyword search found', results.length, 'results');
      } catch (error) {
        console.error('Error in multi-keyword search:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const [selectedReportWarningKeys, setSelectedReportWarningKeys] = useState<string[]>([]);

  const handlePdfClear = () => {
    setPdfText(null);
    setPdfFileName(null);
    setPrioritizeErrors(false);
    setComplianceResult(null);
    setSelectedReportWarningKeys([]);
    setActiveTab('legislation');
  };

  // Compute comparisons for all entries
  const comparisons = useMemo<Map<string, ComparisonResult>>(() => {
    const map = new Map<string, ComparisonResult>();
    if (!pdfText) return map;
    for (const entry of data) {
      map.set(entry.id, comparePdfToLegislation(pdfText, entry.title, entry.summary));
    }
    return map;
  }, [pdfText, data]);

  const toggleReportWarning = (key: string) => {
    setSelectedReportWarningKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectedReportItems = useMemo<ReportWarningItem[]>(() => {
    const items: ReportWarningItem[] = [];
    for (const entry of data) {
      const comparison = comparisons.get(entry.id);
      if (!comparison) continue;
      comparison.complianceIssues.forEach((issue, idx) => {
        const key = `${entry.id}-${idx}`;
        if (selectedReportWarningKeys.includes(key)) {
          items.push({
            key,
            entry,
            issue,
            score: comparison.score,
            matchedKeywords: comparison.matchedKeywords,
          });
        }
      });
    }
    return items;
  }, [data, comparisons, selectedReportWarningKeys]);

  const buildReportPayload = () => {
    if (selectedReportItems.length === 0 || !pdfFileName) return null;
    return {
      items: selectedReportItems,
      companyDetails,
      pdfFileName,
      generatedAt: new Date().toISOString(),
    };
  };

  const goToReportPage = () => {
    const payload = buildReportPayload();
    if (!payload) return;
    const id = stashReportPayload(payload);
    navigate(`/report?id=${encodeURIComponent(id)}`);
  };

  const openReportPdfPage = () => {
    const payload = buildReportPayload();
    if (!payload) return;
    const id = stashReportPayload(payload);
    window.open(`${window.location.origin}/report/pdf?id=${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer');
  };

  const displayData = useMemo(() => {
    if (!pdfText || !prioritizeErrors) return data;
    return [...data].sort((a, b) => {
      const ca = comparisons.get(a.id);
      const cb = comparisons.get(b.id);
      const hasA = (ca?.complianceIssues.length ?? 0) > 0 ? 1 : 0;
      const hasB = (cb?.complianceIssues.length ?? 0) > 0 ? 1 : 0;
      if (hasB !== hasA) return hasB - hasA;
      const sa = ca?.score ?? 0;
      const sb = cb?.score ?? 0;
      return sb - sa;
    });
  }, [data, prioritizeErrors, comparisons, pdfText]);

  return (
    <div style={{ minHeight: '100vh', padding: '1rem 2rem 4rem' }}>
      {/* Background Decor */}
      <div style={{
        position: 'fixed', top: '-10%', right: '-5%',
        width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 65%)',
        zIndex: -1, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', left: '-5%',
        width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, transparent 65%)',
        zIndex: -1, pointerEvents: 'none',
      }} />

      {/* Header */}
      <header style={{ textAlign: 'center', marginTop: '3rem', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '12px',
          marginBottom: '1rem', padding: '8px 16px',
          background: 'var(--card-bg)', borderRadius: 0,
          border: '1px solid var(--card-border)',
        }}>
          <Sparkles size={18} color="var(--text-secondary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            UK compliance intelligence
          </span>
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '1rem', textTransform: 'uppercase' }}>
          CompPro
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Search UK legislation and compare it against your documents in real time.
        </p>
      </header>

      <SearchBar onSearch={handleSearch} loading={loading} />

      <main style={{ maxWidth: '1300px', margin: '0 auto' }}>
        {/* PDF Upload Panel */}
        <div
          className="glass"
          style={{
            borderRadius: 0,
            marginBottom: '2.5rem',
            overflow: 'hidden',
            border: pdfFileName
              ? '1px solid rgba(255, 255, 255, 0.12)'
              : '1px solid var(--glass-border)',
          }}
        >
          {/* Panel Header */}
          <button
            onClick={() => setPdfPanelOpen(o => !o)}
            style={{
              width: '100%',
              background: 'transparent',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.1rem 1.5rem',
              color: 'var(--text-primary)',
              borderRadius: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileSearch size={20} color={pdfFileName ? 'var(--text-secondary)' : 'var(--text-secondary)'} />
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                {pdfFileName ? `Comparing with: ${pdfFileName}` : 'PDF Comparison Tool'}
              </span>
              {pdfFileName && (
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-secondary)',
                  padding: '2px 10px', borderRadius: 0,
                }}>
                  Active
                </span>
              )}
            </div>
            {pdfPanelOpen ? <ChevronUp size={18} color="var(--text-secondary)" /> : <ChevronDown size={18} color="var(--text-secondary)" />}
          </button>

          {/* Collapsible Body */}
          {pdfPanelOpen && (
            <div style={{ padding: '0 1.5rem 1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  Company details for context
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    Company type
                    <select
                      value={companyDetails.companyType}
                      onChange={(e) => updateCompanyDetail('companyType', e.target.value)}
                      style={selectStyle}
                    >
                      <option>Private Limited Company</option>
                      <option>Public Limited Company</option>
                      <option>Community Interest Company</option>
                      <option>Charitable Company</option>
                      <option>Startup / Tech</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    Sector
                    <select
                      value={companyDetails.sector}
                      onChange={(e) => updateCompanyDetail('sector', e.target.value)}
                      style={selectStyle}
                    >
                      <option>General Business</option>
                      <option>Technology</option>
                      <option>Financial Services</option>
                      <option>Healthcare</option>
                      <option>Retail</option>
                      <option>Food & Hospitality</option>
                      <option>Construction</option>
                      <option>Education</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    Tax status
                    <select
                      value={companyDetails.taxStatus}
                      onChange={(e) => updateCompanyDetail('taxStatus', e.target.value)}
                      style={selectStyle}
                    >
                      <option>Corporation Tax Registered</option>
                      <option>Corporation Tax Not Registered</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    VAT status
                    <select
                      value={companyDetails.vatStatus}
                      onChange={(e) => updateCompanyDetail('vatStatus', e.target.value)}
                      style={selectStyle}
                    >
                      <option>Not VAT Registered</option>
                      <option>VAT Registered</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    Employees
                    <select
                      value={companyDetails.employeeStatus}
                      onChange={(e) => updateCompanyDetail('employeeStatus', e.target.value)}
                      style={selectStyle}
                    >
                      <option>No Employees</option>
                      <option>Has Employees</option>
                      <option>Contractors Only</option>
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                    Website / app
                    <select
                      value={companyDetails.websitePresence}
                      onChange={(e) => updateCompanyDetail('websitePresence', e.target.value)}
                      style={selectStyle}
                    >
                      <option>Website / App</option>
                      <option>No Website</option>
                      <option>E-commerce Platform</option>
                    </select>
                  </label>
                </div>
              </div>

              <PdfUploader
                onTextExtracted={handlePdfExtracted}
                onKeywordsExtracted={handleKeywordsExtracted}
                onClear={handlePdfClear}
                fileName={pdfFileName}
              />
              {pdfText && (
                <div style={{ marginTop: '1rem' }}>
                  <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    Extracted <strong style={{ color: 'var(--text-primary)' }}>{pdfText.split(/\s+/).length.toLocaleString()}</strong> words from PDF.
                    Results below are ranked by relevance to your document.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {pdfText && (
          <div className="glass" style={{ marginBottom: '1.5rem', padding: '4px', borderRadius: 0, display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('legislation')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px', borderRadius: 0,
                background: activeTab === 'legislation' ? 'var(--card-bg)' : 'transparent',
                color: activeTab === 'legislation' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              <Database size={18} />
              Legislation Search
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              disabled={!complianceResult}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px', borderRadius: 0,
                background: activeTab === 'compliance' ? 'var(--card-bg)' : 'transparent',
                color: activeTab === 'compliance' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: 500,
                opacity: !complianceResult ? 0.5 : 1,
                cursor: !complianceResult ? 'not-allowed' : 'pointer',
              }}
            >
              <Shield size={18} />
              Compliance Check
              {!complianceResult && (
                <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>(Processing...)</span>
              )}
            </button>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'compliance' ? (
          complianceResult ? (
            // <ComplianceChecker complianceResult={complianceResult} pdfText={pdfText} />
            <div>Compliance Checker Placeholder</div>
          ) : (
            <div
              style={{
                padding: '2rem',
                borderRadius: 0,
                border: '1px dashed rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.02)',
                textAlign: 'center',
              }}
            >
              <Shield size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Compliance Analysis in Progress
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Please wait while we analyze your document for UK company compliance requirements...
              </p>
              {pdfText && (
                <p style={{ fontSize: '0.875rem', marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
                  Document uploaded successfully. Processing keywords...
                </p>
              )}
            </div>
          )
        ) : (
          <>
            {/* Results toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>
                {loading
                  ? 'Fetching records...'
                  : `${displayData.length} Result${displayData.length !== 1 ? 's' : ''}${pdfText && prioritizeErrors ? ' — errors first' : ''}`}
              </h2>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {pdfText && (
                  <button
                    onClick={() => setPrioritizeErrors(s => !s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', fontSize: '0.85rem',
                      background: prioritizeErrors ? 'rgba(255, 255, 255, 0.06)' : 'var(--card-bg)',
                      color: prioritizeErrors ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${prioritizeErrors ? 'rgba(255,255,255,0.12)' : 'var(--card-border)'}`,
                      borderRadius: 0,
                    }}
                  >
                    <SlidersHorizontal size={14} />
                    {prioritizeErrors ? 'Errors first' : 'Default order'}
                  </button>
                )}

                {selectedReportItems.length > 0 && (
                  <>
                    <button
                      onClick={goToReportPage}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 14px', fontSize: '0.85rem',
                        background: '#27272a',
                        color: '#e4e4e7',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 0,
                        cursor: 'pointer',
                      }}
                    >
                      <FileCheck size={14} />
                      View report
                    </button>
                    <button
                      onClick={openReportPdfPage}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 14px', fontSize: '0.85rem',
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: 0,
                        cursor: 'pointer',
                      }}
                    >
                      <FileDown size={14} />
                      PDF page
                    </button>
                  </>
                )}

                <div className="glass" style={{ padding: '4px', borderRadius: 0, display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '8px', borderRadius: 0,
                      background: viewMode === 'grid' ? 'var(--card-bg)' : 'transparent',
                      color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <LayoutGrid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      padding: '8px', borderRadius: 0,
                      background: viewMode === 'list' ? 'var(--card-bg)' : 'transparent',
                      color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>

            {pdfText && (
              <div style={{ marginBottom: '1.5rem', padding: '1.25rem', borderRadius: 0, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Selected report warnings</h3>
                    <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                      {selectedReportItems.length > 0
                        ? `You have selected ${selectedReportItems.length} warning${selectedReportItems.length !== 1 ? 's' : ''} for the report.`
                        : 'Select warnings from each legislation card to include them in the report.'}
                    </p>
                  </div>
                  {selectedReportItems.length > 0 && (
                    <button
                      onClick={() => setSelectedReportWarningKeys([])}
                      style={{
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 0,
                        padding: '10px 14px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Results grid */}
            {loading && data.length === 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="premium-card" style={{ height: '220px', background: 'rgba(255,255,255,0.01)' }} />
                ))}
              </div>
            ) : displayData.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(360px, 1fr))' : '1fr',
                gap: '1.5rem',
              }}>
                {displayData.map(entry => (
                  <LegislationCard
                    key={entry.id}
                    entry={entry}
                    onClick={e => setSelectedEntry(e)}
                    comparison={comparisons.get(entry.id)}
                    selectedIssueKeys={selectedReportWarningKeys}
                    onToggleIssueSelection={toggleReportWarning}
                  />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--card-bg)', borderRadius: 0 }}>
                <Database size={48} color="var(--text-secondary)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No legislation found matching your criteria.</p>
              </div>
            )}
          </>
        )}
      </main>

      <footer style={{ marginTop: '5rem', borderTop: '1px solid var(--card-border)', paddingTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Data sourced directly from legislation.gov.uk • PDF comparison powered by PDF.js
        </p>
      </footer>

      <DocumentViewer entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
    </div>
  );
};

export default App;
