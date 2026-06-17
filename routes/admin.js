const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const HiringRequest = require('../models/HiringRequest');
const LawyerProfile = require('../models/LawyerProfile');

// Protect all admin routes
router.use([auth, role(['admin'])]);

// @route   GET api/admin/users
// @desc    Get all users list
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ dateJoined: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/admin/users/:id/role
// @desc    Modify user role (user/client, lawyer, or admin)
// @access  Private (Admin only)
router.patch('/users/:id/role', async (req, res) => {
  const { role: newRole } = req.body;

  if (!['user', 'lawyer', 'admin'].includes(newRole)) {
    return res.status(400).json({ msg: 'Invalid role assignment' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.role = newRole;
    await user.save();

    // If role changed to user, and they have a lawyer profile, remove it
    if (newRole === 'user') {
      await LawyerProfile.findOneAndDelete({ user: req.params.id });
    }

    res.json({ msg: `User role successfully changed to ${newRole}`, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user completely
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ msg: 'Admin cannot delete their own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    await LawyerProfile.findOneAndDelete({ user: req.params.id });
    await HiringRequest.deleteMany({ $or: [{ client: req.params.id }, { lawyer: req.params.id }] });

    res.json({ msg: 'User and all related records removed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/transactions
// @desc    Get all transaction logs
// @access  Private (Admin only)
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/analytics
// @desc    Get counts & revenue reports
// @access  Private (Admin only)
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalLawyers = await LawyerProfile.countDocuments();
    const totalHires = await HiringRequest.countDocuments();
    
    // Sum revenue from transaction records
    const transactions = await Transaction.find();
    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      totalUsers,
      totalLawyers,
      totalHires,
      totalRevenue,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
