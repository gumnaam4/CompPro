interface ExtractionResult {
  keywords: string[];
  topics: string[];
  summary: string;
}

/**
 * Extract relevant keywords and topics from PDF text via backend API
 * The backend uses NVIDIA's Minimax API for keyword extraction
 */
export async function extractKeywordsFromPdf(pdfText: string): Promise<ExtractionResult> {
  try {
    const response = await fetch('http://localhost:5000/api/extract-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfText }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const result = await response.json() as ExtractionResult;
    return result;
  } catch (error) {
    console.warn('Could not extract keywords from backend:', error);
    // Fallback to simple extraction
    return {
      keywords: extractSimpleKeywords(pdfText),
      topics: ['legislation', 'policy', 'regulation'],
      summary: 'Document analysis (fallback)',
    };
  }
}

/**
 * Simple fallback keyword extraction when backend API fails
 */
function extractSimpleKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was',
    'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new',
    'now', 'old', 'see', 'two', 'way', 'use', 'with', 'that', 'this', 'from', 'they',
    'will', 'have', 'been', 'more', 'than', 'when', 'who', 'what', 'which', 'their',
    'should', 'would', 'could', 'shall', 'be', 'is', 'as', 'or', 'in', 'at', 'to', 'by',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stopWords.has(w));

  // Count word frequency
  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  // Return top 10 most frequent words
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
