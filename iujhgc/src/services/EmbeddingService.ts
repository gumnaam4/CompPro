/**
 * Generate embeddings for text using hash-based method
 * Returns a vector representation suitable for similarity search
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Using hash-based embedding as a lightweight fallback
    // In production, you could call a backend embedding endpoint
    return createHashBasedEmbedding(text);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return createHashBasedEmbedding(text);
  }
}

/**
 * Create a simplified embedding using text hashing
 * This is a fallback when API embedding is unavailable
 */
function createHashBasedEmbedding(text: string): number[] {
  const normalized = text.toLowerCase().split(/\s+/).join(' ');
  const embedding: number[] = new Array(384).fill(0);

  // Simple hash-based embedding
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
    embedding[i % 384] += (hash / 100000) % 2 - 1;
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? embedding.map(v => v / magnitude) : embedding;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
  const mag1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
  const mag2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
}

/**
 * Batch generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return Promise.all(texts.map(text => generateEmbedding(text)));
}
