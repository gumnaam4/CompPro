import React, { useState } from 'react';
import { Calendar, Tag, ChevronRight, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { LegislationEntry } from '../services/LegislationService';
import type { ComparisonResult, ComplianceIssue } from '../services/PdfService';

interface LegislationCardProps {
  entry: LegislationEntry;
  onClick: (entry: LegislationEntry) => void;
  comparison?: ComparisonResult;
  selectedIssueKeys: string[];
  onToggleIssueSelection: (key: string, entry: LegislationEntry, issue: ComplianceIssue, idx: number) => void;
}

const LegislationCard: React.FC<LegislationCardProps> = ({ entry, onClick, comparison, selectedIssueKeys, onToggleIssueSelection }) => {
  const [showCompliance, setShowCompliance] = useState(false);

  const hasComplianceIssues = comparison && comparison.complianceIssues.length > 0;
  const criticalIssues = comparison?.complianceIssues.filter(i => i.severity === 'critical') || [];

  const statusBackground = comparison
    ? hasComplianceIssues
      ? 'rgba(220, 38, 38, 0.30)'
      : 'rgba(21, 128, 61, 0.30)'
    : 'rgba(255, 255, 255, 0.03)';
  const statusBorder = comparison
    ? hasComplianceIssues
      ? '1px solid rgba(220, 38, 38, 0.65)'
      : '1px solid rgba(22, 163, 74, 0.65)'
    : '1px solid rgba(255, 255, 255, 0.06)';

  return (
    <div
      className="premium-card animate-fade-in"
      onClick={() => onClick(entry)}
      style={{
        padding: '1.5rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: hasComplianceIssues ? '280px' : '220px',
        background: statusBackground,
        border: statusBorder,
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '4px 8px',
              borderRadius: 0,
            }}
          >
            {entry.category}
          </span>
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', lineHeight: '1.3' }}>
          {entry.title}
        </h3>

        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          marginBottom: '1rem',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {entry.summary}
        </p>

        {/* Matched keywords from PDF */}
        {comparison && comparison.matchedKeywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.75rem' }}>
            {comparison.matchedKeywords.slice(0, 5).map(kw => (
              <span
                key={kw}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 0,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Compliance Issues */}
        {hasComplianceIssues && (
          <div style={{ marginTop: '0.75rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCompliance(!showCompliance);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 0,
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#ef4444',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} />
                {criticalIssues.length > 0 && <span>🚨</span>}
                {comparison.complianceIssues.length} Compliance Issue{comparison.complianceIssues.length !== 1 ? 's' : ''}
              </div>
              {showCompliance ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showCompliance && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 0,
                border: '1px solid rgba(239, 68, 68, 0.1)'
              }}>
                {comparison.complianceIssues.map((issue, idx) => {
                  const issueKey = `${entry.id}-${idx}`;
                  const isSelected = selectedIssueKeys.includes(issueKey);
                  const severityLabel = issue.severity === 'critical' ? 'CRITICAL' : issue.severity === 'high' ? 'HIGH' : issue.severity === 'medium' ? 'MEDIUM' : 'LOW';

                  return (
                    <div key={idx} style={{ marginBottom: idx < comparison.complianceIssues.length - 1 ? '0.75rem' : '0' }}>
                      <label style={{ display: 'grid', gap: '0.5rem', cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => onToggleIssueSelection(issueKey, entry, issue, idx)}
                              onClick={e => e.stopPropagation()}
                              style={{ width: '16px', height: '16px' }}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {issue.category}: {issue.description}
                            </span>
                          </div>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            color: '#ffffff',
                            padding: '4px 8px',
                            borderRadius: 0,
                            background: issue.severity === 'critical' ? '#b91c1c' : issue.severity === 'high' ? '#c2410c' : issue.severity === 'medium' ? '#d97706' : '#2563eb',
                          }}>
                            {severityLabel}
                          </span>
                        </div>
                        <div style={{ paddingLeft: '24px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          💡 {issue.suggestedAction}
                        </div>
                      </label>
                    </div>
                  );
                })}

                {comparison.recommendations.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1', marginBottom: '0.25rem' }}>
                      Quick Actions:
                    </div>
                    {comparison.recommendations.slice(0, 2).map((rec, idx) => (
                      <div key={idx} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                        {rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Compliance Success Indicator */}
        {comparison && !hasComplianceIssues && comparison.score > 50 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 0,
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#10b981',
            marginTop: '0.75rem'
          }}>
            <CheckCircle size={14} />
            Appears compliant
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            {entry.date}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={14} />
            {entry.type}
          </div>
        </div>

        <div style={{
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.9rem',
          fontWeight: 600,
        }}>
          View <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );
};

export default LegislationCard;
