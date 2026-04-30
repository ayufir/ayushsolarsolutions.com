const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'approved', 'rejected'],
    default: 'pending'
  },
  proofImages: [String], // Array of uploaded selfie URLs/base64 strings
  submittedAt: {
    type: Date
  },
  locationAtCompletion: {
    latitude: Number,
    longitude: Number
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);
