import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle } from 'lucide-react';
import { extractPdfText } from '../services/PdfService';
import { extractKeywordsFromPdf } from '../services/KeywordExtractionService';

interface PdfUploaderProps {
  onTextExtracted: (text: string, fileName: string) => void;
  onKeywordsExtracted?: (keywords: string[], topics: string[]) => void;
  onClear: () => void;
  fileName: string | null;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ onTextExtracted, onKeywordsExtracted, onClear, fileName }) => {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const text = await extractPdfText(file);
      onTextExtracted(text, file.name);

      // Extract keywords in background
      setExtracting(true);
      try {
        const result = await extractKeywordsFromPdf(text);
        onKeywordsExtracted?.(result.keywords, result.topics);
        console.log('Extracted keywords:', result.keywords);
        console.log('Extracted topics:', result.topics);
      } catch (e) {
        console.warn('Keyword extraction failed, continuing without it', e);
      } finally {
        setExtracting(false);
      }
    } catch (e: any) {
      setError('Failed to parse PDF. Please try another file.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [onTextExtracted, onKeywordsExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div style={{ width: '100%' }}>
      {fileName ? (
        /* Uploaded state */
        <div
          className="glass"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 0,
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={20} color="var(--text-secondary)" />
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>PDF ready for comparison</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>{fileName}</p>
            </div>
          </div>
          <button
            onClick={onClear}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-secondary)',
              padding: '0.4rem',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        /* Drop zone */
        <label
          htmlFor="pdf-upload"
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '2rem',
            borderRadius: 0,
            border: `2px dashed ${dragging ? 'rgba(255, 255, 255, 0.15)' : 'var(--glass-border)'}`,
            background: dragging ? 'rgba(255, 255, 255, 0.04)' : 'var(--card-bg)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
          {loading ? (
            <>
              <Loader2 size={32} color="var(--text-secondary)" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Extracting PDF text...</p>
            </>
          ) : (
            <>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 0,
                padding: '1rem',
              }}>
                {dragging ? <FileText size={28} color="var(--text-secondary)" /> : <Upload size={28} color="var(--text-secondary)" />}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>
                  {dragging ? 'Drop your PDF here' : 'Upload a PDF for comparison'}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Drag & drop or click to browse
                </p>
              </div>
            </>
          )}
          {error && (
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>
          )}
        </label>
      )}

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PdfUploader;
