import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileDown, ArrowLeft } from 'lucide-react';
import { loadReportPayload } from '../reportPayloadStorage';
import { ReportDocument } from '../components/ReportDocument';
import { useReportActionPlan } from '../hooks/useReportActionPlan';

const ReportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const payload = id ? loadReportPayload(id) : null;
  const { aiPlanLoading, aiPlanText } = useReportActionPlan(id);

  if (!id || !payload) {
    return (
      <div
        style={{
          padding: '2rem',
          maxWidth: 560,
          margin: '0 auto',
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          background: '#000',
          minHeight: '100vh',
          color: '#d4d4d8',
        }}
      >
        <h1 style={{ marginTop: 0 }}>Report not found</h1>
        <p style={{ color: '#71717a', lineHeight: 1.6 }}>
          This link is invalid or the report data is no longer in your browser. Generate a new report from CompPro.
        </p>
        <Link to="/" style={{ color: '#a1a1aa', fontWeight: 600 }}>
          Back to CompPro
        </Link>
      </div>
    );
  }

  const pdfUrl = `/report/pdf?id=${encodeURIComponent(id)}`;

  return (
    <div style={{ minHeight: '100vh', background: '#000000' }}>
      <div
        className="rp-toolbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(10, 10, 10, 0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            color: '#a1a1aa',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={18} /> Back
        </Link>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 0,
            background: '#27272a',
            color: '#e4e4e7',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <FileDown size={16} /> Open PDF page
        </a>
      </div>
      <ReportDocument
        variant="screen"
        items={payload.items}
        companyDetails={payload.companyDetails}
        pdfFileName={payload.pdfFileName}
        generatedAt={payload.generatedAt}
        aiPlanLoading={aiPlanLoading}
        aiPlanText={aiPlanText}
      />
    </div>
  );
};

export default ReportPage;
