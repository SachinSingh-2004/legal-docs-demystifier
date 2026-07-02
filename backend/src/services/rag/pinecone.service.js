const { Pinecone } = require('@pinecone-database/pinecone');

// In-Memory Vector DB for development/testing fallback
class LocalVectorDb {
  constructor() {
    this.store = []; // items format: { id, values, metadata }
  }

  upsert(vectors) {
    vectors.forEach(v => {
      // Check if vector already exists and replace, else push
      const idx = this.store.findIndex(item => item.id === v.id);
      if (idx !== -1) {
        this.store[idx] = v;
      } else {
        this.store.push(v);
      }
    });
    return { upsertedCount: vectors.length };
  }

  query(queryVector, documentId, topK = 5) {
    const docVectors = this.store.filter(item => item.metadata.documentId === documentId);
    
    const results = docVectors.map(v => {
      const score = this.cosineSimilarity(queryVector, v.values);
      return {
        id: v.id,
        score,
        metadata: v.metadata
      };
    });

    // Sort descending by score and pick top K
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  delete(documentId) {
    const beforeCount = this.store.length;
    this.store = this.store.filter(item => item.metadata.documentId !== documentId);
    return { deletedCount: beforeCount - this.store.length };
  }

  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

class PineconeService {
  constructor() {
    this.pc = null;
    this.index = null;
    this.localDb = new LocalVectorDb();
  }

  init() {
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX) {
      try {
        this.pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        this.index = this.pc.index(process.env.PINECONE_INDEX);
      } catch (err) {
        console.error('Failed to initialize Pinecone client:', err.message);
        this.pc = null;
        this.index = null;
      }
    }
  }

  /**
   * Store chunk embedding vectors in Pinecone (or in local memory fallback).
   * @param {string} documentId - Document identifier
   * @param {Array<Object>} chunks - Array of chunk text objects
   * @param {Array<Array<number>>} vectors - Array of embedding vectors
   */
  async upsertVectors(documentId, chunks, vectors) {
    this.init();

    const formattedVectors = chunks.map((chunk, idx) => ({
      id: `${documentId}_${chunk.id}`,
      values: vectors[idx],
      metadata: {
        documentId: documentId.toString(),
        chunkId: chunk.id,
        pageNumber: chunk.pageNumber,
        text: chunk.text
      }
    }));

    if (!this.index) {
      console.log('PINECONE not configured. Upserting into local in-memory vector database.');
      return this.localDb.upsert(formattedVectors);
    }

    try {
      // Pinecone requires upserts to fit payload limit, we partition them
      const batchSize = 100;
      for (let i = 0; i < formattedVectors.length; i += batchSize) {
        const batch = formattedVectors.slice(i, i + batchSize);
        await this.index.upsert(batch);
      }
      return { upsertedCount: formattedVectors.length };
    } catch (err) {
      console.error('Pinecone upsert error, falling back to local memory database:', err.message);
      return this.localDb.upsert(formattedVectors);
    }
  }

  /**
   * Search for closest semantic match chunks.
   * @param {string} documentId - Filter search to this document
   * @param {Array<number>} queryVector - Query text embedding vector
   * @param {number} topK - Number of chunks to retrieve
   */
  async queryVectors(documentId, queryVector, topK = 5) {
    this.init();

    if (!this.index) {
      return this.localDb.query(queryVector, documentId.toString(), topK);
    }

    try {
      const queryResponse = await this.index.query({
        vector: queryVector,
        topK,
        filter: { documentId: { $eq: documentId.toString() } },
        includeMetadata: true
      });

      if (queryResponse && queryResponse.matches) {
        return queryResponse.matches.map(match => ({
          id: match.id,
          score: match.score,
          metadata: match.metadata
        }));
      }
      return [];
    } catch (err) {
      console.error('Pinecone query error, falling back to local memory database search:', err.message);
      return this.localDb.query(queryVector, documentId.toString(), topK);
    }
  }

  /**
   * Delete all vectors belonging to a document.
   * @param {string} documentId
   */
  async deleteVectors(documentId) {
    this.init();

    if (!this.index) {
      return this.localDb.delete(documentId.toString());
    }

    try {
      await this.index.deleteMany({
        filter: { documentId: { $eq: documentId.toString() } }
      });
      return { success: true };
    } catch (err) {
      console.error('Pinecone delete error, falling back to local memory database:', err.message);
      return this.localDb.delete(documentId.toString());
    }
  }
}

module.exports = new PineconeService();
