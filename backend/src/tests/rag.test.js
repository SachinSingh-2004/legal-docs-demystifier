const chunkingService = require('../services/rag/chunking.service');
const embeddingService = require('../services/rag/embedding.service');
const pineconeService = require('../services/rag/pinecone.service');

describe('RAG Pipeline Unit Tests', () => {
  describe('Chunking Service', () => {
    it('should split text into semantic chunks at paragraph boundaries', () => {
      const docText = `Paragraph 1 text content details.
      
Paragraph 2 contains some details.
      
[Page 2] Paragraph 3 is on a different page.`;

      const chunks = chunkingService.chunkText(docText, 100, 20);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toHaveProperty('id');
      expect(chunks[0]).toHaveProperty('text');
      expect(chunks[0]).toHaveProperty('pageNumber');
      
      // Page tracker should capture [Page 2]
      const pageTwoChunk = chunks.find(c => c.pageNumber === 2);
      expect(pageTwoChunk).toBeDefined();
    });

    it('should handle empty or null text gracefully', () => {
      expect(chunkingService.chunkText('')).toEqual([]);
      expect(chunkingService.chunkText(null)).toEqual([]);
    });
  });

  describe('Embedding Service fallback', () => {
    it('should generate a 768-dimension vector even without API keys (development fallback)', async () => {
      const embedding = await embeddingService.generateEmbedding('Sample legal text');
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(768);
    });
  });

  describe('Pinecone Local Fallback (InMemory Vector DB)', () => {
    it('should store and query semantic vectors locally when Pinecone is unconfigured', async () => {
      const documentId = 'doc123';
      const chunks = [
        { id: '0', text: 'This is the payment clause of INR 50,000.', pageNumber: 1 },
        { id: '1', text: 'This is the termination notice period of 90 days.', pageNumber: 2 }
      ];
      // Simulated 768-dim embeddings
      const mockVector0 = Array.from({ length: 768 }, (_, idx) => idx === 0 ? 1 : 0);
      const mockVector1 = Array.from({ length: 768 }, (_, idx) => idx === 1 ? 1 : 0);
      const vectors = [mockVector0, mockVector1];

      // Upsert
      const upsertResult = await pineconeService.upsertVectors(documentId, chunks, vectors);
      expect(upsertResult.upsertedCount).toBe(2);

      // Search using a query vector close to mockVector1
      const queryVector = Array.from({ length: 768 }, (_, idx) => idx === 1 ? 0.9 : 0.1);
      const results = await pineconeService.queryVectors(documentId, queryVector, 1);
      
      expect(results.length).toBe(1);
      expect(results[0].metadata.chunkId).toBe('1');
      expect(results[0].metadata.pageNumber).toBe(2);

      // Delete vectors
      const deleteResult = await pineconeService.deleteVectors(documentId);
      expect(deleteResult.deletedCount).toBe(2);
    });
  });
});
