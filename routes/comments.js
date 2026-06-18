const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const Comment = require('../models/Comment');
const HiringRequest = require('../models/HiringRequest');
const LawyerProfile = require('../models/LawyerProfile');

// Helper function to update lawyer rating statistics
async function updateLawyerRating(lawyerId) {
  try {
    const reviews = await Comment.find({ lawyer: lawyerId });
    const count = reviews.length;
    
    let avg = 5.0;
    let sum = 0;

    if (count > 0) {
      sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      avg = Number((sum / count).toFixed(1));
    }

    await LawyerProfile.findByIdAndUpdate(lawyerId, {
      reviewsCount: count,
      ratingSum: sum,
      ratingAverage: avg
    });
  } catch (err) {
    console.error(`Failed to update rating statistics: ${err.message}`);
  }
}

// @route   POST api/comments
// @desc    Add a comment/review on a lawyer (Only allowed if client has a paid hiring request with the lawyer)
// @access  Private (Role: user/client)
router.post('/', [auth, role(['user'])], async (req, res) => {
  const { lawyerId, rating, text } = req.body;

  if (!lawyerId || rating === undefined || !text) {
    return res.status(400).json({ msg: 'Please provide lawyerId, rating (1-5), and review text' });
  }

  try {
    // 1. Check if the lawyer exists
    const lawyer = await LawyerProfile.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ msg: 'Lawyer profile not found' });
    }

    // 2. Validate client has hired this lawyer and paid successfully
    const completedHire = await HiringRequest.findOne({
      client: req.user.id,
      lawyer: lawyerId,
      status: 'paid'
    });

    if (!completedHire) {
      return res.status(403).json({ msg: 'Only clients with a paid, completed booking may leave a review.' });
    }

    // 3. Create review
    const newComment = new Comment({
      client: req.user.id,
      lawyer: lawyerId,
      rating: Number(rating),
      text,
    });

    await newComment.save();
    
    // 4. Update LawyerProfile aggregated average ratings
    await updateLawyerRating(lawyerId);

    // 5. Populate and return
    const comment = await Comment.findById(newComment._id).populate('client', 'name email avatar');
    res.status(201).json(comment);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lawyer profile not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/comments/lawyer/:lawyerId
// @desc    Get all comments/reviews for a specific lawyer
// @access  Public
router.get('/lawyer/:lawyerId', async (req, res) => {
  try {
    const comments = await Comment.find({ lawyer: req.params.lawyerId })
      .populate('client', 'name email avatar')
      .sort({ dateCreated: -1 });
    
    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/comments/my-comments
// @desc    Get comments written by the logged-in client
// @access  Private
router.get('/my-comments', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ client: req.user.id })
      .populate({
        path: 'lawyer',
        populate: {
          path: 'user',
          select: 'name email avatar',
        },
      })
      .sort({ dateCreated: -1 });

    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/comments/:id
// @desc    Update a comment
// @access  Private
router.put('/:id', auth, async (req, res) => {
  const { rating, text } = req.body;
  const updates = {};
  if (rating !== undefined) updates.rating = Number(rating);
  if (text) updates.text = text;

  try {
    let comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Ensure comment owner is updating
    if (comment.client.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('client', 'name email avatar');

    // Update rating stats on lawyer profile
    await updateLawyerRating(comment.lawyer);

    res.json(comment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE api/comments/:id
// @desc    Delete a comment
// @access  Private (Owner or Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Ensure owner or admin is deleting
    if (comment.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const lawyerId = comment.lawyer;
    await Comment.findByIdAndDelete(req.params.id);
    
    // Update rating stats on lawyer profile
    await updateLawyerRating(lawyerId);

    res.json({ msg: 'Comment removed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
