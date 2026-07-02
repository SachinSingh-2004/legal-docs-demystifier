/**
 * Semantic chunking service for legal text
 */
class ChunkingService {
  /**
   * Split document text into semantic chunks of roughly 1000-1500 tokens.
   * Standard estimation: 1 token ≈ 4 characters, so 1000-1500 tokens is ~4000-6000 characters.
   * Uses paragraph boundaries to preserve semantic context.
   * Includes overlap between consecutive chunks.
   *
   * @param {string} text - Raw document text
   * @param {number} targetChunkSize - Ideal size in characters
   * @param {number} overlap - Overlap size in characters
   * @returns {Array<Object>} Array of chunk objects with text and page numbers
   */
  chunkText(text, targetChunkSize = 5000, overlap = 800) {
    if (!text || text.trim().length === 0) return [];

    const paragraphs = text.split(/\n+/);
    const chunks = [];
    let currentChunk = '';
    let currentPage = 1;
    let chunkIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (!paragraph) continue;

      // Track page breaks (e.g. standard PDF form feeds or page marks like [Page 2])
      const pageBreaks = paragraph.match(/\[Page\s*(\d+)\]|\f/i);
      if (pageBreaks) {
        if (pageBreaks[1]) {
          currentPage = parseInt(pageBreaks[1]);
        } else {
          currentPage++;
        }
      }

      if ((currentChunk + ' ' + paragraph).length <= targetChunkSize) {
        currentChunk += (currentChunk ? '\n' : '') + paragraph;
      } else {
        if (currentChunk) {
          chunks.push({
            id: `chunk_${chunkIndex++}`,
            text: currentChunk,
            pageNumber: currentPage
          });
        }

        // Handle overlap: start the new chunk with the last portion of the current chunk
        const overlapStart = Math.max(0, currentChunk.length - overlap);
        const overlapText = currentChunk.slice(overlapStart);
        
        // Find nearest space/sentence boundary in overlap to prevent cutting words
        const boundaryIdx = overlapText.indexOf(' ');
        const safetyOverlap = boundaryIdx !== -1 ? overlapText.slice(boundaryIdx).trim() : overlapText;

        currentChunk = (safetyOverlap ? safetyOverlap + '\n' : '') + paragraph;
      }
    }

    // Push the final chunk
    if (currentChunk) {
      chunks.push({
        id: `chunk_${chunkIndex++}`,
        text: currentChunk,
        pageNumber: currentPage
      });
    }

    return chunks;
  }
}

module.exports = new ChunkingService();
