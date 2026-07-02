const aiService = require('../services/ai/ai.service');

describe('AI Service Layer Unit Tests', () => {
  describe('JSON Cleaning Utility', () => {
    it('should strip markdown blocks and extract valid JSON objects', () => {
      const responseWithMarkdown = `Some conversational text.
\`\`\`json
{
  "confidenceScore": 0.95,
  "riskLevel": "high"
}
\`\`\`
Footer text here.`;

      const parsed = aiService.cleanAndParseJSON(responseWithMarkdown);
      expect(parsed.confidenceScore).toBe(0.95);
      expect(parsed.riskLevel).toBe('high');
    });

    it('should parse raw JSON strings directly', () => {
      const rawJson = '{"riskLevel": "low"}';
      const parsed = aiService.cleanAndParseJSON(rawJson);
      expect(parsed.riskLevel).toBe('low');
    });

    it('should throw an error for malformed JSON texts', () => {
      expect(() => {
        aiService.cleanAndParseJSON('invalid json content string');
      }).toThrow('AI returned an invalid JSON response structure.');
    });
  });

  describe('Offline Rule Analysis Engine Fallback', () => {
    it('should use offline analysis fallback when AI providers are not initialized', async () => {
      // Force disable API keys to test fallback path
      const originalGeminiKey = process.env.GEMINI_API_KEY;
      const originalOpenAIKey = process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const dummyChunks = 'SALE CONSIDERATION: The total sale consideration for the property is INR 75,00,000.';
      const result = await aiService.analyzeDocument(dummyChunks, 'default', 'test_agreement.pdf');

      expect(result).toHaveProperty('executiveSummary');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('financialObligations');
      expect(result.financialObligations.length).toBeGreaterThan(0);

      // Restore keys
      process.env.GEMINI_API_KEY = originalGeminiKey;
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    });
  });

  describe('Offline Chat Q&A Fallback', () => {
    it('should fallback to offline context snippet extraction if no AI models are available', async () => {
      // Disable key
      const originalGeminiKey = process.env.GEMINI_API_KEY;
      const originalOpenAIKey = process.env.OPENAI_API_KEY;
      delete process.env.GEMINI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const fullDocumentText = 'Target lease payment is due monthly on the 5th.';

      const answer = await aiService.chatAboutDocument('How to pay?', fullDocumentText, []);
      expect(answer).toContain('[OFFLINE ANSWER]');
      expect(answer).toContain('Target lease payment');

      // Restore keys
      process.env.GEMINI_API_KEY = originalGeminiKey;
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    });
  });
});
