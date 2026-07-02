const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema({
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
  modifications: [
    {
      field: String, // e.g. "payment amount", "notice period"
      original: String,
      modified: String
    }
  ],
  result: mongoose.Schema.Types.Mixed, // Stored simulated risk change results
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Simulation', SimulationSchema);
