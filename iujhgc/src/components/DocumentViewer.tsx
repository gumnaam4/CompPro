import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ArrowLeft, Loader2 } from 'lucide-react';
import { type LegislationEntry, fetchDocumentContent } from '../services/LegislationService';

interface DocumentViewerProps {
  entry: LegislationEntry | null;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ entry, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (entry) {
      setLoading(true);
      fetchDocumentContent(entry.xmlLink)
        .then(res => setContent(res))
        .catch(() => setContent("Error loading content."))
        .finally(() => setLoading(false));
    }
  }, [entry]);

  if (!entry) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.97)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <header 
        className="glass"
        style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={onClose}
            style={{ 
              background: 'var(--card-bg)', 
              color: 'var(--text-primary)', 
              padding: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: 0
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{entry.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{entry.type} • {entry.date}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a 
            href={entry.link} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              background: 'var(--card-bg)', 
              color: 'var(--text-primary)', 
              padding: '0.6rem 1rem',
              borderRadius: 0,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem'
            }}
          >
            <ExternalLink size={16} /> Official Source
          </a>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--text-secondary)' }}
          >
            <X size={24} />
          </button>
        </div>
      </header>

      <main 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '3rem 10%', 
          backgroundColor: '#000000',
          color: '#d4d4d8',
          lineHeight: '1.8'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
            <Loader2 className="animate-spin" size={48} color="var(--text-secondary)" />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Extracting legislation text...</p>
          </div>
        ) : (
          <div 
            className="animate-fade-in"
            style={{ 
              maxWidth: '900px', 
              margin: '0 auto', 
              whiteSpace: 'pre-wrap',
              fontSize: '1.1rem',
              padding: '2rem',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 0,
              border: '1px solid var(--card-border)'
            }}
          >
            {content}
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentViewer;
