const mongoose = require('mongoose');

const LawyerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  bio: {
    type: String,
    required: true,
    trim: true,
  },
  specialization: {
    type: String,
    required: true,
    trim: true,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['Available', 'Busy'],
    default: 'Available',
  },
  badge: {
    type: String,
    default: 'Rising Star',
  },
  image: {
    type: String,
    required: true,
  },
  reviewsCount: {
    type: Number,
    default: 0,
  },
  ratingSum: {
    type: Number,
    default: 0,
  },
  ratingAverage: {
    type: Number,
    default: 5.0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  hiresCount: {
    type: Number,
    default: 0,
  },
  dateJoined: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('LawyerProfile', LawyerProfileSchema);
