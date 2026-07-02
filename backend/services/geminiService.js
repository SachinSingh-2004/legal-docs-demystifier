const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

function getModel() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return model;
}

/**
 * Analyze a legal document and return structured analysis
 */
async function analyzeDocument(text, persona = 'default', fileName = 'document') {
  const m = getModel();
  if (!m) throw new Error('GEMINI_API_KEY not configured');

  const personaInstructions = {
    student: 'Explain concepts simply as if to a university student. Define legal terms, provide educational context, and make it easy to understand.',
    business: 'Focus on business implications, financial impacts, and operational considerations for an entrepreneur or business owner.',
    lawyer: 'Provide technical legal analysis with references to relevant legal principles, potential precedents, and professional considerations.',
    senior: 'Use very clear, patient language. Focus on protecting rights, identifying potential pitfalls, and ensuring the person is not taken advantage of.',
    default: 'Provide a clear, balanced analysis suitable for a general audience.'
  };

  const personaGuide = personaInstructions[persona] || personaInstructions.default;

  const prompt = `You are an expert legal document analyzer. Analyze the following legal document and return a comprehensive JSON analysis.

PERSONA: ${personaGuide}

DOCUMENT (filename: ${fileName}):
"""
${text.slice(0, 12000)}
"""

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "documentType": "detected document type",
  "language": "English",
  "confidence": 0.90,
  "summary": {
    "title": "Brief document title",
    "overview": "2-3 sentence plain language overview tailored to the persona",
    "riskLevel": "low|medium|high",
    "keyFindings": ["finding 1", "finding 2", "finding 3", "finding 4"]
  },
  "riskAssessment": {
    "overall": "low|medium|high",
    "categories": [
      { "name": "Financial Risk", "level": "low|medium|high", "score": 5, "details": "explanation" },
      { "name": "Legal Risk", "level": "low|medium|high", "score": 5, "details": "explanation" },
      { "name": "Operational Risk", "level": "low|medium|high", "score": 5, "details": "explanation" }
    ]
  },
  "keyClauses": [
    {
      "title": "Clause name",
      "text": "Relevant excerpt from document (max 200 chars)",
      "importance": "high|medium|low",
      "type": "financial|legal|operational",
      "explanation": "Plain language explanation tailored to persona"
    }
  ],
  "redFlags": [
    { "severity": "high|medium|low", "title": "Flag title", "description": "Clear explanation of concern" }
  ],
  "actionItems": ["Action 1", "Action 2", "Action 3"],
  "highlights": {
    "amounts": ["list of monetary amounts found"],
    "dates": ["list of dates found"],
    "percentages": ["list of percentages found"],
    "parties": ["list of party names found"]
  },
  "suggestions": [
    { "type": "negotiation|clarification|legal_review", "title": "Suggestion title", "description": "What to do and why" }
  ],
  "counterparty": {
    "grade": "A|B|C|D|F",
    "score": 75,
    "label": "Grade label",
    "notes": "Analysis of terms fairness to the other party"
  },
  "rights": [
    { "title": "Your right", "description": "Explanation of this right in this document", "status": "protected|at_risk|waived" }
  ],
  "compliance": [
    { "law": "Law name", "status": "compliant|needs_review|non_compliant", "note": "Details" }
  ]
}`;

  const result = await m.generateContent(prompt);
  const responseText = result.response.text();
  
  // Extract JSON from response
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format from AI');
  
  return JSON.parse(jsonMatch[0]);
}

/**
 * Answer a question about a document
 */
async function chatAboutDocument(question, documentContext, conversationHistory = []) {
  const m = getModel();
  if (!m) throw new Error('GEMINI_API_KEY not configured');

  const historyText = conversationHistory.slice(-6).map(h => 
    `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`
  ).join('\n');

  const prompt = `You are a helpful legal document assistant. Answer questions about the following legal document clearly and concisely.

DOCUMENT CONTEXT:
"""
${documentContext.slice(0, 8000)}
"""

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}

USER QUESTION: ${question}

Provide a clear, helpful answer. If the information is not in the document, say so. Keep your answer under 300 words unless more detail is specifically needed.`;

  const result = await m.generateContent(prompt);
  return result.response.text();
}

/**
 * Simulate a what-if scenario
 */
async function whatIfAnalysis(originalText, modifications) {
  const m = getModel();
  if (!m) throw new Error('GEMINI_API_KEY not configured');

  const modsText = modifications.map(m => `- ${m.field}: "${m.original}" → "${m.modified}"`).join('\n');

  const prompt = `You are a legal risk analyst. Compare the risk implications of these contract modifications.

ORIGINAL DOCUMENT (excerpt):
"""
${originalText.slice(0, 6000)}
"""

PROPOSED MODIFICATIONS:
${modsText}

Return ONLY valid JSON (no markdown):
{
  "summary": "Brief overall impact summary",
  "riskChange": "increased|decreased|unchanged",
  "overallBefore": "low|medium|high",
  "overallAfter": "low|medium|high",
  "categories": [
    {
      "name": "Category",
      "scoreBefore": 5,
      "scoreAfter": 7,
      "change": "increased|decreased|unchanged",
      "impact": "Explanation of the change"
    }
  ],
  "implications": ["Implication 1", "Implication 2"],
  "recommendation": "Accept|Negotiate|Reject",
  "reasoning": "Why this recommendation"
}`;

  const result = await m.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response format');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Generate auto-suggestions for a document
 */
async function generateSuggestions(text, documentType) {
  const m = getModel();
  if (!m) throw new Error('GEMINI_API_KEY not configured');

  const prompt = `You are a legal advisor. Review this ${documentType} document and provide specific, actionable suggestions.

DOCUMENT:
"""
${text.slice(0, 8000)}
"""

Return ONLY valid JSON array (no markdown):
[
  {
    "type": "negotiation|clarification|legal_review|missing_clause",
    "priority": "high|medium|low",
    "title": "Suggestion title",
    "description": "What to do and why (2-3 sentences)",
    "clause": "The relevant clause or section (if applicable)"
  }
]

Provide 5-8 specific, actionable suggestions.`;

  const result = await m.generateContent(prompt);
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid response format');
  return JSON.parse(jsonMatch[0]);
}

module.exports = { analyzeDocument, chatAboutDocument, whatIfAnalysis, generateSuggestions, getModel };
