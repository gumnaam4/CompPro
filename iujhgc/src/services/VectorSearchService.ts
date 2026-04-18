import { QdrantClient } from '@qdrant/js-client-rest';
import { generateEmbedding, cosineSimilarity } from './EmbeddingService';

const QDRANT_URL = 'http://localhost:6333';
const COLLECTION_NAME = 'legislation';

interface SearchResult {
  id: string;
  similarity: number;
  metadata: Record<string, any>;
}

let client: QdrantClient | null = null;

/**
 * Initialize Qdrant client connection
 */
export async function initializeVectorSearch(): Promise<void> {
  try {
    client = new QdrantClient({ url: QDRANT_URL });

    // Check if collection exists, create if not
    try {
      await client.getCollection(COLLECTION_NAME);
      console.log('[Vector Search] Collection exists ✓');
    } catch {
      console.log('[Vector Search] Creating collection...');
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 384,
          distance: 'Cosine',
        },
      });
      console.log('[Vector Search] Collection created ✓');
    }
  } catch (error) {
    console.warn('[Vector Search] Failed to initialize Qdrant:', error);
    console.log('[Vector Search] Continuing with fallback mode');
    client = null;
  }
}

/**
 * Index a legislation entry in the vector database
 */
export async function indexLegislation(
  id: string,
  title: string,
  summary: string,
  metadata: Record<string, any>
): Promise<void> {
  if (!client) {
    console.warn('[Vector Search] Client not initialized, skipping indexing');
    return;
  }

  try {
    const text = `${title} ${summary}`;
    const embedding = await generateEmbedding(text);

    await client.upsert(COLLECTION_NAME, {
      points: [
        {
          id: hashStringToNumber(id),
          vector: embedding,
          payload: { ...metadata, id, title, summary },
        },
      ],
    });
  } catch (error) {
    console.warn('[Vector Search] Failed to index legislation:', error);
  }
}

/**
 * Search for legislation by vector similarity
 */
export async function vectorSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
  if (!client) {
    console.warn('[Vector Search] Client not initialized, using fallback');
    return [];
  }

  try {
    const queryEmbedding = await generateEmbedding(query);

    const results = await client.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
    });

    return results.map(result => ({
      id: result.payload?.id || String(result.id),
      similarity: result.score,
      metadata: result.payload || {},
    }));
  } catch (error) {
    console.warn('[Vector Search] Search failed:', error);
    return [];
  }
}

/**
 * Batch search for multiple keywords
 */
export async function batchVectorSearch(
  keywords: string[],
  limit: number = 3
): Promise<Map<string, SearchResult[]>> {
  const results = new Map<string, SearchResult[]>();

  for (const keyword of keywords) {
    const searchResults = await vectorSearch(keyword, limit);
    results.set(keyword, searchResults);
  }

  return results;
}

/**
 * Clear all entries from the collection
 */
export async function clearCollection(): Promise<void> {
  if (!client) return;

  try {
    await client.deleteCollection(COLLECTION_NAME);
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 384,
        distance: 'Cosine',
      },
    });
    console.log('[Vector Search] Collection cleared ✓');
  } catch (error) {
    console.warn('[Vector Search] Failed to clear collection:', error);
  }
}

/**
 * Convert string ID to number for Qdrant (which requires numeric IDs)
 */
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(): Promise<{ pointCount: number } | null> {
  if (!client) return null;

  try {
    const stats = await client.getCollection(COLLECTION_NAME);
    return { pointCount: stats.points_count };
  } catch (error) {
    console.warn('[Vector Search] Failed to get stats:', error);
    return null;
  }
}
