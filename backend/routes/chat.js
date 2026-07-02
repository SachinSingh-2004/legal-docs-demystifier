const express = require('express');
const { chatAboutDocument } = require('../services/geminiService');
const router = express.Router();

/**
 * POST /api/chat
 * Body: { question, documentText, conversationHistory }
 */
router.post('/', express.json(), async (req, res) => {
  try {
    const { question, documentText, conversationHistory = [] } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }
    if (!documentText || documentText.trim().length < 20) {
      return res.status(400).json({ error: 'Document context is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback: rule-based answer hints
      const answer = generateOfflineAnswer(question, documentText);
      return res.json({ success: true, answer, source: 'offline' });
    }

    const answer = await chatAboutDocument(question, documentText, conversationHistory);
    res.json({ success: true, answer, source: 'gemini' });

  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: err.message || 'Chat failed' });
  }
});

function generateOfflineAnswer(question, text) {
  const q = question.toLowerCase();
  const t = text.toLowerCase();

  const keywordAnswers = [
    { keywords: ['payment', 'pay', 'amount', 'fee', 'cost'], finder: () => {
      const match = text.match(/(payment|fee|amount)[^.]{0,200}\./i);
      return match ? `Payment information found: "${match[0].trim()}"` : 'Payment terms are mentioned in the document. Please review the relevant section for exact amounts and schedules.';
    }},
    { keywords: ['terminat', 'cancel', 'end', 'exit'], finder: () => {
      const match = text.match(/(terminat|cancel)[^.]{0,200}\./i);
      return match ? `Termination clause found: "${match[0].trim()}"` : 'The document likely contains termination provisions. Look for sections marked "Termination" or "Cancellation."';
    }},
    { keywords: ['notice', 'days', 'period'], finder: () => {
      const match = text.match(/\d+\s*(business\s*)?days?\s*(notice|prior)/i);
      return match ? `Notice period found: "${match[0].trim()}"` : 'The notice period is specified in the document. Look for phrases like "X days notice."';
    }},
    { keywords: ['confiden', 'disclose', 'secret', 'nda'], finder: () => 'Confidentiality obligations are typically found in the NDA or confidentiality section. Review what information must be kept private and for how long.' },
    { keywords: ['law', 'jurisdiction', 'govern', 'court'], finder: () => {
      const match = text.match(/governed by.{0,100}/i);
      return match ? `Governing law: "${match[0].trim()}"` : 'The governing law clause specifies which legal system applies to this agreement.';
    }},
    { keywords: ['liability', 'liable', 'damages'], finder: () => {
      const match = text.match(/liability.{0,200}/i);
      return match ? `Liability clause: "${match[0].slice(0,200).trim()}..."` : 'Liability terms define the maximum amount one party can claim from the other in case of breach.';
    }}
  ];

  for (const { keywords, finder } of keywordAnswers) {
    if (keywords.some(kw => q.includes(kw))) return finder();
  }

  return `I found the document but the AI service is not configured. To enable intelligent Q&A, add a GEMINI_API_KEY to your .env file. \n\nFor now, try searching the document for keywords related to your question: "${question}"`;
}

module.exports = router;
