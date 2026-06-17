const mongoose = require('mongoose');

const HiringRequestSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LawyerProfile',
    required: true,
  },
  fee: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'paid'],
    default: 'pending',
  },
  stripeSessionId: {
    type: String,
  },
  transactionId: {
    type: String,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('HiringRequest', HiringRequestSchema);
