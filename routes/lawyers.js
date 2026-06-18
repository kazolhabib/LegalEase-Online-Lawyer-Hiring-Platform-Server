const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const LawyerProfile = require('../models/LawyerProfile');
const User = require('../models/User');

// @route   GET api/lawyers
// @desc    Get all lawyer profiles with filtering, sorting, pagination
// @access  Public
router.get('/', async (req, res) => {
  const { search, specialization, status, rateMin, rateMax, page = 1, limit = 6, sort } = req.query;

  try {
    let filterQuery = {};

    // Direct Specialization Filter
    if (specialization) {
      filterQuery.specialization = { $regex: new RegExp(specialization, 'i') };
    }

    // Status / Availability Filter
    if (status) {
      filterQuery.status = status;
    }

    // Consultation Fee Rate Range Filter
    if (rateMin || rateMax) {
      filterQuery.rate = {};
      if (rateMin) filterQuery.rate.$gte = Number(rateMin);
      if (rateMax) filterQuery.rate.$lte = Number(rateMax);
    }

    // Global Search across Name, Specialization and Bio
    if (search) {
      // First, find user IDs whose names match the search query
      const users = await User.find({ name: { $regex: new RegExp(search, 'i') } });
      const userIds = users.map(u => u._id);

      filterQuery.$or = [
        { user: { $in: userIds } },
        { specialization: { $regex: new RegExp(search, 'i') } },
        { bio: { $regex: new RegExp(search, 'i') } }
      ];
    }

    // Count matching documents for pagination metadata
    const totalCount = await LawyerProfile.countDocuments(filterQuery);

    // Apply Sorting
    let sortOptions = { dateJoined: -1 };
    if (sort === 'rate_asc') sortOptions = { rate: 1 };
    if (sort === 'rate_desc') sortOptions = { rate: -1 };
    if (sort === 'rating') sortOptions = { ratingAverage: -1 };

    // Fetch matching lawyer profiles
    const lawyers = await LawyerProfile.find(filterQuery)
      .populate('user', 'name email avatar')
      .sort(sortOptions)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      lawyers,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / Number(limit)),
        currentPage: Number(page),
        limit: Number(limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/lawyers/id
// @desc    Get a single lawyer profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const lawyer = await LawyerProfile.findById(req.params.id).populate('user', 'name email avatar');
    if (!lawyer) {
      return res.status(404).json({ msg: 'Lawyer profile not found' });
    }
    res.json(lawyer);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lawyer profile not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/lawyers
// @desc    Create or update current lawyer's profile
// @access  Private Role: lawyer
router.post('/', [auth, role(['lawyer'])], async (req, res) => {
  const { bio, specialization, rate, image, status, badge } = req.body;

  if (!bio || !specialization || rate === undefined || !image) {
    return res.status(400).json({ msg: 'Please provide all required profile fields' });
  }

  const profileFields = {
    user: req.user.id,
    bio,
    specialization,
    rate: Number(rate),
    image,
  };

  if (status) profileFields.status = status;
  if (badge) profileFields.badge = badge;

  try {
    let profile = await LawyerProfile.findOne({ user: req.user.id });

    if (profile) {
      // Update existing profile
      profile = await LawyerProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      ).populate('user', 'name email avatar');
      return res.json(profile);
    }

    // Create a new lawyer profile
    profile = new LawyerProfile(profileFields);
    await profile.save();
    profile = await LawyerProfile.findById(profile._id).populate('user', 'name email avatar');
    res.status(201).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE api/lawyers/:id
// @desc    Delete a lawyer profile
// @access  Private (Role: lawyer, admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const lawyer = await LawyerProfile.findById(req.params.id);
    if (!lawyer) {
      return res.status(404).json({ msg: 'Lawyer profile not found' });
    }

    // Ensure user matches profile owner or is admin
    if (lawyer.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await LawyerProfile.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Profile removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
