const embeddingService = require('./embedding.service');
const pineconeService = require('./pinecone.service');

class RetrievalService {
  /**
   * Retrieves top relevant text chunks for a query from a document.
   * @param {string} documentId - The document to query against
   * @param {string} queryText - User's search text / question
   * @param {number} topK - Number of relevant chunks to retrieve
   * @returns {Promise<Array<Object>>} List of matching chunks with text, pageNumber, score
   */
  async retrieveContext(documentId, queryText, topK = 4) {
    if (!documentId) throw new Error('Document ID is required for retrieval');
    if (!queryText || queryText.trim().length === 0) return [];

    try {
      // 1. Generate query embedding
      const queryVector = await embeddingService.generateEmbedding(queryText);

      // 2. Query vector database (Pinecone or local fallback)
      const matches = await pineconeService.queryVectors(documentId, queryVector, topK);

      // 3. Format and return matches
      return matches.map(match => ({
        chunkId: match.metadata.chunkId,
        text: match.metadata.text,
        pageNumber: match.metadata.pageNumber,
        score: match.score
      }));
    } catch (err) {
      console.error('Failed to retrieve context:', err.message);
      return [];
    }
  }
}

module.exports = new RetrievalService();
