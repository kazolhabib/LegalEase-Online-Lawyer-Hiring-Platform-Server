const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/google
// @desc    Google OAuth login/register callback handler
// @access  Public
router.post('/google', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ msg: 'Google auth requires an idToken' });
  }

  try {
    // Verify token with Google's API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!googleRes.ok) {
      return res.status(400).json({ msg: 'Invalid Google token' });
    }
    const tokenInfo = await googleRes.json();

    // Verify client_id matches
    const clientId = process.env.GOOGLE_CLIENT_ID || '810619721461-16ub90cr5ivqb12s8o5mvjm8mss0n9kq.apps.googleusercontent.com';
    if (tokenInfo.aud !== clientId) {
      return res.status(400).json({ msg: 'Google token audience mismatch' });
    }

    const { email, name, picture } = tokenInfo;
    if (!email) {
      return res.status(400).json({ msg: 'Google auth did not return an email' });
    }

    let isNewUser = false;
    let user = await User.findOne({ email });

    if (!user) {
      isNewUser = true;
      // Create user
      user = new User({
        name: name || 'Google User',
        email,
        avatar: picture || '',
        password: await bcrypt.hash(Math.random().toString(36).slice(-10), 10),
      });
      await user.save();
    } else if (picture && !user.avatar) {
      // Update avatar if they didn't have one before
      user.avatar = picture;
      await user.save();
    }

    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }, isNewUser });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET api/auth/profile
// @desc    Get logged in user details
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile (name/avatar)
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, avatar } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (avatar) updates.avatar = avatar;

  try {
    let user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/auth/role
// @desc    Update user role post-registration (user or lawyer)
// @access  Private
router.put('/role', auth, async (req, res) => {
  const { role } = req.body;

  if (!['user', 'lawyer'].includes(role)) {
    return res.status(400).json({ msg: 'Invalid role assignment' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { role } },
      { new: true }
    ).select('-password');

    // Return new JWT with updated role
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
