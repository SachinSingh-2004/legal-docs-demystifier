// Global chat router
const express = require('express');
const { protect } = require('../modules/auth/auth.middleware');
const Document = require('../models/Document');
const Chat = require('../models/Chat');

const retrievalService = require('../services/rag/retrieval.service');
const aiService = require('../services/ai/ai.service');
const logger = require('../config/logger');

const router = express.Router();

/**
 * @swagger
 * /api/chat/:documentId:
 *   post:
 *     summary: Chat about a legal document using RAG pipeline context
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         type: string
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             question:
 *               type: string
 *     responses:
 *       200:
 *         description: Chat response generated
 */
router.post('/:documentId', protect, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // 1. Verify document ownership
    const document = await Document.findById(documentId);
    if (!document || document.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    // 2. Fetch existing chat history or create new session
    let chatSession = await Chat.findOne({ documentId, userId: req.user.id });
    if (!chatSession) {
      chatSession = await Chat.create({
        documentId,
        userId: req.user.id,
        messages: []
      });
    }

    // Extract recent messages to provide as historical context (max 6 messages)
    const history = chatSession.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 3. Get document text context (full-context for new uploads, fallback to RAG chunk context for legacy uploads)
    let chatContextText = '';
    let citations = [];

    if (document && document.extractedText) {
      chatContextText = document.extractedText;
      citations = [{
        pageNumber: 1,
        text: document.extractedText.slice(0, 150) + '...',
        chunkId: 'full_text'
      }];
    } else {
      logger.info(`Extracted text missing. Falling back to RAG retrieval for Doc: ${documentId}`);
      const relevantChunks = await retrievalService.retrieveContext(documentId, question, 6);
      chatContextText = relevantChunks.map(c => c.text).join('\n\n');
      citations = relevantChunks.map(chunk => ({
        pageNumber: chunk.pageNumber,
        text: chunk.text.slice(0, 150) + '...',
        chunkId: chunk.chunkId
      }));
    }

    // 4. Generate chatbot response
    const answer = await aiService.chatAboutDocument(question, chatContextText, history);

    // 6. Save message exchange in MongoDB
    chatSession.messages.push({
      role: 'user',
      content: question
    });
    chatSession.messages.push({
      role: 'assistant',
      content: answer,
      citations
    });
    await chatSession.save();

    res.json({
      success: true,
      answer,
      citations,
      chatSession
    });

  } catch (err) {
    logger.error(`Error in chat route: ${err.message}`);
    res.status(500).json({ error: err.message || 'Chat processing failure' });
  }
});

/**
 * @swagger
 * /api/chat/:documentId:
 *   get:
 *     summary: Retrieve chat history for a document
 *     security:
 *       - bearerAuth: []
 */
router.get('/:documentId', protect, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document || document.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const chatSession = await Chat.findOne({ documentId, userId: req.user.id });
    res.json({
      success: true,
      chatSession: chatSession || { messages: [] }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
