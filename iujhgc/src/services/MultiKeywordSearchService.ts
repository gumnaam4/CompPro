import { searchLegislation, type LegislationEntry } from './LegislationService';
import { vectorSearch, batchVectorSearch } from './VectorSearchService';

interface KeywordSearchResult {
  keyword: string;
  results: LegislationEntry[];
  vectorResults: Array<{
    id: string;
    similarity: number;
    metadata: Record<string, any>;
  }>;
}

/**
 * Search legislation for a single keyword using both traditional and vector search
 */
export async function searchByKeyword(keyword: string): Promise<KeywordSearchResult> {
  try {
    // Parallel traditional and vector search
    const [traditionalResults, vectorResults] = await Promise.all([
      searchLegislation(keyword),
      vectorSearch(keyword, 5),
    ]);

    // Deduplicate and merge results
    const allResults = new Map<string, LegislationEntry>();
    for (const result of traditionalResults) {
      allResults.set(result.id, result);
    }

    return {
      keyword,
      results: Array.from(allResults.values()),
      vectorResults,
    };
  } catch (error) {
    console.error(`Error searching for keyword "${keyword}":`, error);
    return {
      keyword,
      results: [],
      vectorResults: [],
    };
  }
}

/**
 * Search legislation for multiple keywords
 * Returns the most relevant results aggregated across all keywords
 */
export async function searchByMultipleKeywords(
  keywords: string[],
  limit: number = 20
): Promise<LegislationEntry[]> {
  try {
    // Search for each keyword in parallel
    const searchPromises = keywords.map(keyword => searchByKeyword(keyword));
    const allSearchResults = await Promise.all(searchPromises);

    // Aggregate and deduplicate results
    const resultMap = new Map<string, { entry: LegislationEntry; matchCount: number; vaultSimilarity: number }>();

    for (const searchResult of allSearchResults) {
      // Add traditional search results
      for (const entry of searchResult.results) {
        const key = entry.id;
        if (!resultMap.has(key)) {
          resultMap.set(key, { entry, matchCount: 0, vaultSimilarity: 0 });
        }
        const item = resultMap.get(key)!;
        item.matchCount += 1;
      }

      // Add vector search results with similarity boost
      for (const vectorResult of searchResult.vectorResults) {
        const key = vectorResult.metadata.id || vectorResult.id;
        if (!resultMap.has(key)) {
          // Create entry from vector result metadata
          const entry: LegislationEntry = {
            id: key,
            title: vectorResult.metadata.title || 'Unknown',
            summary: vectorResult.metadata.summary || '',
            link: vectorResult.metadata.link || '',
            xmlLink: vectorResult.metadata.xmlLink || '',
            date: vectorResult.metadata.date || '',
            type: vectorResult.metadata.type || 'Legislation',
            category: vectorResult.metadata.category || 'General',
          };
          resultMap.set(key, { entry, matchCount: 0, vaultSimilarity: vectorResult.similarity });
        } else {
          const item = resultMap.get(key)!;
          item.vaultSimilarity = Math.max(item.vaultSimilarity, vectorResult.similarity);
        }
      }
    }

    // Sort by combined score: match count + vector similarity
    const sorted = Array.from(resultMap.values())
      .sort((a, b) => {
        const scoreA = a.matchCount * 10 + a.vaultSimilarity * 100; // Weighted score
        const scoreB = b.matchCount * 10 + b.vaultSimilarity * 100;
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(item => item.entry);

    return sorted;
  } catch (error) {
    console.error('Error searching by multiple keywords:', error);
    return [];
  }
}

/**
 * Search by keywords with streaming/progressive results
 * Useful for UI showing results as they come in
 */
export async function* searchByMultipleKeywordsStreaming(keywords: string[], limit: number = 20) {
  const resultMap = new Map<string, { entry: LegislationEntry; matchCount: number; vaultSimilarity: number }>();

  for (const keyword of keywords) {
    try {
      const searchResult = await searchByKeyword(keyword);

      // Add traditional search results
      for (const entry of searchResult.results) {
        const key = entry.id;
        if (!resultMap.has(key)) {
          resultMap.set(key, { entry, matchCount: 0, vaultSimilarity: 0 });
        }
        const item = resultMap.get(key)!;
        item.matchCount += 1;
      }

      // Add vector search results
      for (const vectorResult of searchResult.vectorResults) {
        const key = vectorResult.metadata.id || vectorResult.id;
        if (!resultMap.has(key)) {
          const entry: LegislationEntry = {
            id: key,
            title: vectorResult.metadata.title || 'Unknown',
            summary: vectorResult.metadata.summary || '',
            link: vectorResult.metadata.link || '',
            xmlLink: vectorResult.metadata.xmlLink || '',
            date: vectorResult.metadata.date || '',
            type: vectorResult.metadata.type || 'Legislation',
            category: vectorResult.metadata.category || 'General',
          };
          resultMap.set(key, { entry, matchCount: 0, vaultSimilarity: vectorResult.similarity });
        } else {
          const item = resultMap.get(key)!;
          item.vaultSimilarity = Math.max(item.vaultSimilarity, vectorResult.similarity);
        }
      }

      // Sort and yield current results
      const sorted = Array.from(resultMap.values())
        .sort((a, b) => {
          const scoreA = a.matchCount * 10 + a.vaultSimilarity * 100;
          const scoreB = b.matchCount * 10 + b.vaultSimilarity * 100;
          return scoreB - scoreA;
        })
        .slice(0, limit)
        .map(item => item.entry);

      yield { keyword, results: sorted };
    } catch (error) {
      console.error(`Error searching for keyword "${keyword}":`, error);
    }
  }
}
