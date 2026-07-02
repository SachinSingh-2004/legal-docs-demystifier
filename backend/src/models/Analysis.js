const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  persona: {
    type: String,
    enum: ['student', 'business', 'lawyer', 'senior', 'default'],
    default: 'default'
  },
  language: {
    type: String,
    enum: ['en', 'hi'],
    default: 'en'
  },
  confidenceScore: {
    type: Number,
    default: 1.0
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  analysis: {
    executiveSummary: { type: String, default: '' },
    plainLanguageSummary: { type: String, default: '' },
    riskLevel: { type: String, default: 'low' },
    confidenceScore: { type: Number, default: 0.0 },
    importantClauses: { type: [mongoose.Schema.Types.Mixed], default: [] },
    redFlags: { type: [mongoose.Schema.Types.Mixed], default: [] },
    financialObligations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    importantDates: { type: [mongoose.Schema.Types.Mixed], default: [] },
    missingClauses: { type: [mongoose.Schema.Types.Mixed], default: [] },
    recommendations: { type: [mongoose.Schema.Types.Mixed], default: [] },
    atsScore: { type: Number, default: null },
    extractedSkills: { type: [String], default: [] },
    resumeFeedback: { type: [mongoose.Schema.Types.Mixed], default: [] },
    contactInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    actionItems: { type: [String], default: [] },
    hiddenCaveats: { type: [String], default: [] }
  },
  rawOutput: mongoose.Schema.Types.Mixed, // Storing raw output for debugging
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
