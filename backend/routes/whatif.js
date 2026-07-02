const express = require('express');
const { whatIfAnalysis } = require('../services/geminiService');
const { assessRisks, detectClauses, extractEntities, preprocessText } = require('../services/analysisEngine');
const router = express.Router();

/**
 * POST /api/whatif
 * Body: { documentText, modifications: [{ field, original, modified }] }
 */
router.post('/', express.json(), async (req, res) => {
  try {
    const { documentText, modifications } = req.body;

    if (!documentText || documentText.trim().length < 20) {
      return res.status(400).json({ error: 'Document text is required' });
    }
    if (!modifications || !Array.isArray(modifications) || modifications.length === 0) {
      return res.status(400).json({ error: 'At least one modification is required' });
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const result = await whatIfAnalysis(documentText, modifications);
        return res.json({ success: true, result, source: 'gemini' });
      } catch (aiErr) {
        console.warn('Gemini what-if failed, falling back:', aiErr.message);
      }
    }

    // Offline fallback
    const result = computeOfflineWhatIf(documentText, modifications);
    res.json({ success: true, result, source: 'offline' });

  } catch (err) {
    console.error('What-if route error:', err);
    res.status(500).json({ error: err.message });
  }
});

function computeOfflineWhatIf(text, modifications) {
  const normalText = preprocessText(text);
  const entities = extractEntities(normalText);
  const clauses = detectClauses(normalText, entities);
  const before = assessRisks(normalText, clauses, entities);

  // Create modified text by replacing terms
  let modifiedText = normalText;
  modifications.forEach(m => {
    if (m.original && m.modified) {
      modifiedText = modifiedText.replace(new RegExp(escapeRegex(m.original), 'gi'), m.modified);
    }
  });

  const modEntities = extractEntities(modifiedText);
  const modClauses = detectClauses(modifiedText, modEntities);
  const after = assessRisks(modifiedText, modClauses, modEntities);

  const rankLevel = l => l === 'high' ? 3 : l === 'medium' ? 2 : 1;
  const riskBefore = rankLevel(before.riskLevel);
  const riskAfter = rankLevel(after.riskLevel);

  const categories = before.categories.map((cat, i) => {
    const afterCat = after.categories[i] || cat;
    const change = afterCat.score > cat.score ? 'increased' : afterCat.score < cat.score ? 'decreased' : 'unchanged';
    return { name: cat.name, scoreBefore: cat.score, scoreAfter: afterCat.score, change, impact: `${cat.name} ${change} from ${cat.score}/10 to ${afterCat.score}/10.` };
  });

  const riskChangeLabel = riskAfter > riskBefore ? 'increased' : riskAfter < riskBefore ? 'decreased' : 'unchanged';

  const recommendation = riskAfter > riskBefore ? 'Negotiate' : riskAfter < riskBefore ? 'Accept' : 'Negotiate';

  return {
    summary: `Based on ${modifications.length} modification(s), overall risk has ${riskChangeLabel}.`,
    riskChange: riskChangeLabel,
    overallBefore: before.riskLevel,
    overallAfter: after.riskLevel,
    categories,
    implications: modifications.map(m => `Changing "${m.field}" from "${m.original}" to "${m.modified}" may affect contractual obligations.`),
    recommendation,
    reasoning: `The proposed modifications ${riskChangeLabel === 'increased' ? 'introduce higher risk and should be negotiated further.' : riskChangeLabel === 'decreased' ? 'appear to reduce risk. Consider accepting these terms.' : 'do not significantly change the risk profile.'}`
  };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = router;
