const express = require('express');
const { protect } = require('../modules/auth/auth.middleware');
const Document = require('../models/Document');
const Simulation = require('../models/Simulation');

const retrievalService = require('../services/rag/retrieval.service');
const aiService = require('../services/ai/ai.service');
const logger = require('../config/logger');

const router = express.Router();

/**
 * @swagger
 * /api/whatif:
 *   post:
 *     summary: Run what-if risk simulation on a document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             documentId:
 *               type: string
 *             modifications:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   field:
 *                     type: string
 *                   original:
 *                     type: string
 *                   modified:
 *                     type: string
 *     responses:
 *       200:
 *         description: Simulation completed successfully
 */
router.post('/', protect, async (req, res) => {
  try {
    const { documentId, modifications } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }
    if (!modifications || !Array.isArray(modifications) || modifications.length === 0) {
      return res.status(400).json({ error: 'At least one modification is required' });
    }

    // 1. Verify document ownership
    const document = await Document.findById(documentId);
    if (!document || document.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    // 2. Fetch context chunks related to fields being modified
    const queryText = modifications.map(m => `${m.field} ${m.original}`).join(' ');
    logger.info(`Running simulation retrieval for Doc: ${documentId} with terms: "${queryText}"`);
    
    const relevantChunks = await retrievalService.retrieveContext(documentId, queryText, 5);
    const contextText = relevantChunks.map(c => c.text).join('\n\n');

    // 3. Trigger AI What-If Analysis
    const simulationResult = await aiService.whatIfAnalysis(contextText, modifications);

    // 4. Save simulation history to database
    const simulationRecord = await Simulation.create({
      documentId,
      userId: req.user.id,
      modifications,
      result: simulationResult
    });

    res.json({
      success: true,
      result: simulationResult,
      simulationId: simulationRecord._id
    });

  } catch (err) {
    logger.error(`Error in what-if simulation route: ${err.message}`);
    res.status(500).json({ error: err.message || 'Simulation processing failure' });
  }
});

/**
 * @swagger
 * /api/whatif/history/:documentId:
 *   get:
 *     summary: Retrieve history of simulations for a document
 *     security:
 *       - bearerAuth: []
 */
router.get('/history/:documentId', protect, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document || document.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    const simulations = await Simulation.find({ documentId, userId: req.user.id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      simulations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
