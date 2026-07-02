const { GoogleGenerativeAI } = require('@google/generative-ai');
const { runOfflineAnalysis } = require('../../../services/analysisEngine');

class AIService {
  constructor() {
    this.primaryProvider = process.env.PRIMARY_AI_PROVIDER || 'gemini'; // 'gemini' | 'openai'
    this.geminiModelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.openaiModelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  getGeminiModel(systemInstruction = '') {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      return genAI.getGenerativeModel({
        model: this.geminiModelName,
        ...(systemInstruction ? { systemInstruction } : {})
      });
    } catch (err) {
      console.error('Error initializing Gemini model:', err.message);
      return null;
    }
  }

  /**
   * Helper to call OpenAI API using native fetch
   */
  async callOpenAI(systemPrompt, userPrompt) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: this.openaiModelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Main analysis execution. Tries primary provider, falls back to secondary, then to offline.
   */
  async analyzeDocument(retrievedChunksText, persona = 'default', fileName = 'document', jobDescription = '') {
    const personaInstructions = {
      student: 'Explain concepts simply as if to a university student. Define legal terms, provide educational context, and make it easy to understand.',
      business: 'Focus on business implications, financial impacts, and operational considerations for an entrepreneur or business owner.',
      lawyer: 'Provide technical legal analysis with references to relevant legal principles, potential precedents, and professional considerations.',
      senior: 'Use very clear, patient language. Focus on protecting rights, identifying potential pitfalls, and ensuring the person is not taken advantage of.',
      default: 'Provide a clear, balanced analysis suitable for a general audience.'
    };

    const personaGuide = personaInstructions[persona] || personaInstructions.default;

    const systemPrompt = `You are an expert document analyst specializing in both legal/business contracts and professional resume screening.
Analyze the provided document segments and return a comprehensive, highly detailed analysis in JSON format.

Strict Rules for Analysis:
1. Analyze ONLY the provided document content. Do not make assumptions or project outside of it.
2. NEVER invent clauses, experience, credentials, or facts.
3. NEVER assume missing information.
4. If a piece of information or clause is not present in the document segments, return "Information Not Found In Document" instead of generating assumptions.
5. Quote supporting text from the document for your findings.
6. Explain all findings in simple language.
7. Assign risk levels: Low, Medium, High.
8. For every risk detected (for contracts/agreements):
   - Quote the clause.
   - Explain the risk.
   - Explain the consequences.
   - Assign severity (low, medium, high).
9. Dynamic Classification: Detect if the uploaded document is a Resume/CV or an Agreement/Contract.
   - If it is a Resume/CV:
     - Compare candidate's experience, education, and keywords against the target Job Description (if provided). If no Job Description is provided, score it against top industry standards.
     - Calculate an ATS compatibility score from 0 to 100.
     - Extract technical and soft skills into "extractedSkills".
     - Provide granular "resumeFeedback" with constructive issues and concrete suggestions for changes/improvements.
     - Extract name, email, phone, and website/LinkedIn links into "contactInfo".
   - If it is a Legal or Business Document:
     - Extract key clauses, financial obligations, important dates, and missing clauses.
     - Formulate a chronological day-to-day checkable task list of "actionItems".
     - Expose tricky, hidden, or non-standard provisions as "hiddenCaveats" (e.g. autodebits, hidden interest, termination penalties).
10. Ensure both the "executiveSummary" and "plainLanguageSummary" are highly detailed and verbose (at least 250-400 words each), giving deep, meaningful explanations.
11. Fill fields that are completely irrelevant to the document type with appropriate null, empty arrays [], or empty objects {} (e.g., if it is a resume, return empty array for financialObligations; if it is a contract, return null for atsScore).`;

    const userPrompt = `DOCUMENT (filename: ${fileName}):
"""
${retrievedChunksText}
"""

TARGET JOB DESCRIPTION (Use only if relevant/provided):
"""
${jobDescription}
"""

PERSONA TARGET: ${personaGuide}

Return ONLY valid JSON in this exact structure (do not wrap in markdown \`\`\`json block, return pure JSON):
{
  "documentType": "Resume | Lease Agreement | Terms of Service | etc.",
  "language": "English|Hindi",
  "confidenceScore": 0.95,
  "riskLevel": "low|medium|high",
  "executiveSummary": "Highly detailed, verbose summary of the document tailored to the persona (250-300 words)",
  "plainLanguageSummary": "Highly detailed, verbose plain language explanation explaining terms tailored to the persona (300-400 words)",
  "importantClauses": [
    { "title": "Clause Title", "excerpt": "quoted text", "importance": "high|medium|low", "explanation": "explanation" }
  ],
  "redFlags": [
    { "title": "Flag Name", "excerpt": "quoted text", "severity": "high|medium|low", "risk": "risk details", "consequences": "consequences if signed" }
  ],
  "financialObligations": [
    { "description": "Payment / penalty detail", "amount": "INR 50,000 / Information Not Found In Document", "terms": "payment terms text" }
  ],
  "importantDates": [
    { "description": "Due date / notice period", "date": "date string / Information Not Found In Document", "significance": "why it is important" }
  ],
  "missingClauses": [
    { "clause": "Clause Name", "explanation": "Why it is missing and why it should be there" }
  ],
  "recommendations": [
    { "action": "Actionable item", "rationale": "Why this action should be taken" }
  ],
  "atsScore": 85,
  "extractedSkills": ["Skill1", "Skill2"],
  "resumeFeedback": [
    { "category": "Formatting|Skills Match|Content Impact", "issue": "flaw details", "suggestion": "how to improve" }
  ],
  "contactInfo": { "name": "Full Name", "email": "Email Address", "phone": "Phone Number", "links": "URLs" },
  "actionItems": ["Task item 1", "Task item 2"],
  "hiddenCaveats": ["Tricky caveat 1", "Tricky caveat 2"]
}`;

    // Try Gemini Primary
    if (this.primaryProvider === 'gemini' && process.env.GEMINI_API_KEY) {
      try {
        console.log('Sending request to Gemini...');
        const model = this.getGeminiModel(systemPrompt);
        if (model) {
          const result = await model.generateContent(userPrompt);
          const responseText = result.response.text();
          return this.cleanAndParseJSON(responseText);
        }
      } catch (err) {
        console.warn('Gemini primary failed. Attempting OpenAI fallback...', err.message);
      }
    }

    // Try OpenAI Fallback
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('Sending request to OpenAI...');
        const responseText = await this.callOpenAI(systemPrompt, userPrompt);
        return this.cleanAndParseJSON(responseText);
      } catch (err) {
        console.warn('OpenAI fallback failed. Falling back to offline model...', err.message);
      }
    }

    // Double check: if provider was openai and it failed, try Gemini if key exists
    if (this.primaryProvider === 'openai' && process.env.GEMINI_API_KEY) {
      try {
        console.log('Attempting Gemini as alternate fallback...');
        const model = this.getGeminiModel();
        if (model) {
          const result = await model.generateContent([systemPrompt, userPrompt]);
          return this.cleanAndParseJSON(result.response.text());
        }
      } catch (err) {
        console.warn('Gemini alternate fallback failed:', err.message);
      }
    }

    // Offline Local Engine Fallback
    console.log('Using Offline Local Fallback Engine...');
    const result = runOfflineAnalysis(retrievedChunksText, persona, fileName);
    // Flatten result to match output structure
    return {
      documentType: result.documentType,
      language: result.language,
      confidenceScore: result.confidence,
      riskLevel: result.summary.riskLevel,
      executiveSummary: result.summary.title + ': ' + result.summary.overview,
      plainLanguageSummary: result.summary.keyFindings.join('\n'),
      importantClauses: result.keyClauses.map(c => ({ title: c.title, excerpt: c.text, importance: c.importance, explanation: c.explanation })),
      redFlags: result.redFlags.map(rf => ({ title: rf.title, excerpt: 'Information Not Found In Document', severity: rf.severity, risk: rf.description, consequences: 'Information Not Found In Document' })),
      financialObligations: result.highlights.amounts.map(a => ({ description: 'Monetary figure found', amount: a, terms: 'Refer to original text' })),
      importantDates: result.highlights.dates.map(d => ({ description: 'Date mentioned', date: d, significance: 'Key schedule marker' })),
      missingClauses: [{ clause: 'Force Majeure', explanation: 'Not detected in rule-based offline search' }],
      recommendations: result.actionItems.map(act => ({ action: act, rationale: 'Recommended offline task' })),
      atsScore: null,
      extractedSkills: [],
      resumeFeedback: [],
      contactInfo: {},
      actionItems: result.actionItems.map(act => `Todo: ${act}`) || [],
      hiddenCaveats: []
    };
  }

  /**
   * Conversational QA with document context
   */
  async chatAboutDocument(question, fullDocumentText, conversationHistory = []) {
    const historyText = conversationHistory
      .slice(-6)
      .map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
      .join('\n');

    const systemPrompt = `You are an expert document consultant and conversational AI assistant. Your goal is to help the user understand, analyze, and take action on their uploaded document.

Guidelines:
1. Primary Context: Use the provided document text to answer questions about the specific facts, names, terms, dates, and contents of the uploaded file.
2. External Expertise: Think out of the box! If the user asks questions that go beyond what is explicitly written in the document (such as explaining general legal concepts, drafting email responses, comparing terms to industry standards, recommending skills to learn, or suggesting improvements), use your broad knowledge base to provide detailed, helpful answers.
3. Clear Distinction: When providing advice or information not found in the text, clarify that you are drawing from general industry standards or legal practices.
4. Style: Be conversational, direct, formatting-rich (use bold text, lists, and headers), and highly supportive.`;

    const userPrompt = `DOCUMENT TEXT:
"""
${fullDocumentText || 'No document text found.'}
"""

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}
USER QUESTION: ${question}

Provide a clear, highly accurate, and helpful response.`;

    // Try Gemini Primary
    if (this.primaryProvider === 'gemini' && process.env.GEMINI_API_KEY) {
      try {
        const model = this.getGeminiModel(systemPrompt);
        if (model) {
          const result = await model.generateContent(userPrompt);
          return result.response.text();
        }
      } catch (err) {
        console.warn('Gemini Chat failed, attempting OpenAI...', err.message);
      }
    }

    // Try OpenAI Fallback
    if (process.env.OPENAI_API_KEY) {
      try {
        const responseText = await this.callOpenAI(systemPrompt, userPrompt);
        return responseText;
      } catch (err) {
        console.warn('OpenAI Chat failed, using offline Q&A...', err.message);
      }
    }

    // Fallback: rule-based
    return `[OFFLINE ANSWER] ${fullDocumentText ? fullDocumentText.slice(0, 300) + '...' : 'Information Not Found In Document'}`;
  }

  /**
   * Translate text into English/Hindi using Gemini
   */
  async translateAnalysis(analysisObject, targetLanguage = 'hi') {
    const targetLangName = targetLanguage === 'hi' ? 'Hindi' : 'English';
    const systemPrompt = `You are a professional legal translator. Translate the JSON analysis document into standard ${targetLangName}. Keep all JSON key names exactly the same, only translating the string values. Do not translate terms like names of parties if it makes them unrecognizable, but translate the legal explanations, summaries, and action steps.`;
    const userPrompt = `JSON to translate:\n${JSON.stringify(analysisObject, null, 2)}`;

    if (process.env.GEMINI_API_KEY) {
      try {
        const model = this.getGeminiModel(systemPrompt);
        if (model) {
          const result = await model.generateContent(userPrompt);
          return this.cleanAndParseJSON(result.response.text());
        }
      } catch (err) {
        console.warn('Gemini Translation failed, attempting OpenAI...', err.message);
      }
    }

    if (process.env.OPENAI_API_KEY) {
      try {
        const responseText = await this.callOpenAI(systemPrompt, userPrompt);
        return this.cleanAndParseJSON(responseText);
      } catch (err) {
        console.warn('OpenAI Translation failed...', err.message);
      }
    }

    // Simple offline stub
    return {
      ...analysisObject,
      translated: true,
      note: `Translation to ${targetLangName} is not available offline.`
    };
  }

  /**
   * Simulate a what-if scenario by comparing modifications
   */
  async whatIfAnalysis(retrievedContext, modifications) {
    const modsText = modifications.map(m => `- ${m.field}: "${m.original}" → "${m.modified}"`).join('\n');

    const systemPrompt = `You are a legal risk analyst. Compare the risk implications of these contract modifications.`;
    
    const userPrompt = `ORIGINAL DOCUMENT (excerpt):
"""
${retrievedContext}
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

    if (this.primaryProvider === 'gemini' && process.env.GEMINI_API_KEY) {
      try {
        const model = this.getGeminiModel(systemPrompt);
        if (model) {
          const result = await model.generateContent(userPrompt);
          return this.cleanAndParseJSON(result.response.text());
        }
      } catch (err) {
        console.warn('Gemini What-If failed, trying OpenAI...', err.message);
      }
    }

    if (process.env.OPENAI_API_KEY) {
      try {
        const responseText = await this.callOpenAI(systemPrompt, userPrompt);
        return this.cleanAndParseJSON(responseText);
      } catch (err) {
        console.warn('OpenAI What-If failed, using offline fallback...', err.message);
      }
    }

    // Offline simulation fallback
    const riskBefore = 'medium';
    const riskAfter = modifications.some(m => /(penalty|interest|late|indemnity)/i.test(m.field) && parseFloat(m.modified) > parseFloat(m.original)) ? 'high' : 'medium';
    const riskChange = riskAfter === 'high' ? 'increased' : 'unchanged';
    
    return {
      summary: `Based on ${modifications.length} modification(s), overall risk has ${riskChange}.`,
      riskChange,
      overallBefore: riskBefore,
      overallAfter: riskAfter,
      categories: [
        { name: 'Financial Risk', scoreBefore: 5, scoreAfter: riskAfter === 'high' ? 8 : 5, change: riskChange, impact: 'Modified payment or penalty parameters.' }
      ],
      implications: modifications.map(m => `Changing "${m.field}" from "${m.original}" to "${m.modified}" may alter legal exposure.`),
      recommendation: riskAfter === 'high' ? 'Negotiate' : 'Accept',
      reasoning: 'Offline rule estimate based on parameter changes.'
    };
  }

  /**
   * Helper to strip markdown and parse JSON safely
   */
  cleanAndParseJSON(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse AI JSON response, raw text was:', text);
      throw new Error('AI returned an invalid JSON response structure.');
    }
  }
}

module.exports = new AIService();
