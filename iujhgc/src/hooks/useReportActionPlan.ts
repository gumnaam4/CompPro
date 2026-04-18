import { useState, useEffect } from 'react';
import { loadReportPayload } from '../reportPayloadStorage';
import { fetchReportActionPlan, buildFallbackActionPlan } from '../services/ReportActionPlanService';

export function useReportActionPlan(reportId: string | null) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setText(null);
      setLoading(false);
      return;
    }

    const payload = loadReportPayload(reportId);
    if (!payload?.items?.length) {
      setText(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setText(null);

    fetchReportActionPlan(payload)
      .then(t => {
        if (!cancelled) {
          setText(t);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setText(buildFallbackActionPlan(payload.items));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  return { aiPlanLoading: loading, aiPlanText: text };
}
