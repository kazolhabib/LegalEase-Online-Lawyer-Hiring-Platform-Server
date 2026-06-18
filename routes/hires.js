const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const HiringRequest = require('../models/HiringRequest');
const LawyerProfile = require('../models/LawyerProfile');

// @route   POST api/hires
// @desc    Client initiates a hiring request for a lawyer
// @access  Private (Role: user/client)
router.post('/', [auth, role(['user'])], async (req, res) => {
  const { lawyerId, fee } = req.body;

  if (!lawyerId || fee === undefined) {
    return res.status(400).json({ msg: 'Please provide lawyerId and fee amount' });
  }

  try {
    const lawyer = await LawyerProfile.findById(lawyerId);
    if (!lawyer) {
      return res.status(404).json({ msg: 'Lawyer profile not found' });
    }

    const hiringRequest = new HiringRequest({
      client: req.user.id,
      lawyer: lawyerId,
      fee: Number(fee),
      status: 'pending',
    });

    await hiringRequest.save();
    res.status(201).json(hiringRequest);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Lawyer profile not found' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/hires/client
// @desc    Get all hiring requests sent by the logged-in client
// @access  Private (Role: user/client)
router.get('/client', [auth, role(['user'])], async (req, res) => {
  try {
    const hires = await HiringRequest.find({ client: req.user.id })
      .populate({
        path: 'lawyer',
        populate: {
          path: 'user',
          select: 'name email avatar',
        },
      })
      .sort({ dateCreated: -1 });

    res.json(hires);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/hires/lawyer
// @desc    Get all hiring requests received by the logged-in lawyer
// @access  Private (Role: lawyer)
router.get('/lawyer', [auth, role(['lawyer'])], async (req, res) => {
  try {
    // Find the lawyer profile first
    const lawyerProfile = await LawyerProfile.findOne({ user: req.user.id });
    if (!lawyerProfile) {
      return res.status(404).json({ msg: 'Lawyer profile not found' });
    }

    const requests = await HiringRequest.find({ lawyer: lawyerProfile._id })
      .populate('client', 'name email avatar')
      .sort({ dateCreated: -1 });

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PATCH api/hires/:id/status
// @desc    Lawyer accepts or rejects a client's hiring request
// @access  Private (Role: lawyer)
router.patch('/:id/status', [auth, role(['lawyer'])], async (req, res) => {
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ msg: 'Invalid status update. Must be accepted or rejected' });
  }

  try {
    const hiringRequest = await HiringRequest.findById(req.params.id);
    if (!hiringRequest) {
      return res.status(404).json({ msg: 'Hiring request not found' });
    }

    // Ensure lawyer profile matches the request lawyer
    const lawyerProfile = await LawyerProfile.findOne({ user: req.user.id });
    if (!lawyerProfile || hiringRequest.lawyer.toString() !== lawyerProfile._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized to modify this request' });
    }

    if (hiringRequest.status !== 'pending') {
      return res.status(400).json({ msg: 'Request has already been processed' });
    }

    hiringRequest.status = status;
    await hiringRequest.save();

    res.json(hiringRequest);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
