const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  clientEmail: {
    type: String,
    required: true,
  },
  lawyerEmail: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  hireId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HiringRequest',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Transaction', TransactionSchema);
