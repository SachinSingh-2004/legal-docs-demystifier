const express = require('express');
const { protect } = require('../modules/auth/auth.middleware');
const Analysis = require('../models/Analysis');
const Translation = require('../models/Translation');

const aiService = require('../services/ai/ai.service');
const logger = require('../config/logger');

const router = express.Router();

/**
 * @swagger
 * /api/translation/:analysisId:
 *   post:
 *     summary: Translate a document analysis into another language
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         type: string
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             language:
 *               type: string
 *               enum: [hi, en]
 *     responses:
 *       200:
 *         description: Analysis translated successfully
 */
router.post('/:analysisId', protect, async (req, res) => {
  try {
    const { analysisId } = req.params;
    const { language } = req.body; // e.g. 'hi'

    if (!language) {
      return res.status(400).json({ error: 'Language is required' });
    }

    // 1. Fetch analysis and verify ownership
    const analysis = await Analysis.findById(analysisId);
    if (!analysis || analysis.userId.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Analysis report not found or access denied' });
    }

    // 2. Check if translation is already cached in MongoDB
    let cachedTranslation = await Translation.findOne({ analysisId, language });
    if (cachedTranslation) {
      logger.info(`Serving cached ${language} translation for analysis: ${analysisId}`);
      return res.json({
        success: true,
        translation: cachedTranslation.translatedAnalysis
      });
    }

    // 3. Perform AI Translation
    logger.info(`Translating analysis: ${analysisId} to language: ${language}`);
    const translatedJSON = await aiService.translateAnalysis(analysis.analysis, language);

    // 4. Cache translation in MongoDB
    cachedTranslation = await Translation.create({
      analysisId,
      documentId: analysis.documentId,
      userId: req.user.id,
      language,
      translatedAnalysis: translatedJSON
    });

    res.json({
      success: true,
      translation: translatedJSON
    });

  } catch (err) {
    logger.error(`Error in translation route: ${err.message}`);
    res.status(500).json({ error: err.message || 'Translation processing failure' });
  }
});

module.exports = router;
