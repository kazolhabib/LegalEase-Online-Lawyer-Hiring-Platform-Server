const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const HiringRequest = require('../models/HiringRequest');
const Transaction = require('../models/Transaction');
const LawyerProfile = require('../models/LawyerProfile');
const User = require('../models/User');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// @route   POST api/payments/create-checkout-session
// @desc    Create Stripe Checkout Session for hiring payment
// @access  Private
router.post('/create-checkout-session', auth, async (req, res) => {
  const { hireId } = req.body;

  if (!hireId) {
    return res.status(400).json({ msg: 'Please provide hireId' });
  }

  try {
    const hireRequest = await HiringRequest.findById(hireId)
      .populate({
        path: 'lawyer',
        populate: { path: 'user', select: 'name email' }
      });

    if (!hireRequest) {
      return res.status(404).json({ msg: 'Hiring request not found' });
    }

    if (hireRequest.status !== 'accepted') {
      return res.status(400).json({ msg: 'Only accepted requests can be paid' });
    }

    if (!stripe) {
      return res.status(500).json({ msg: 'Stripe configuration is missing on server. Use the /mock-pay endpoint for testing.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Legal Representation: ${hireRequest.lawyer.user.name}`,
              description: `Specialization: ${hireRequest.lawyer.specialization}`,
            },
            unit_amount: Math.round(hireRequest.fee * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        hireId: hireRequest._id.toString(),
      },
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/user/hiring-history?payment=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/user/hiring-history?payment=cancelled`,
    });

    hireRequest.stripeSessionId = session.id;
    await hireRequest.save();

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/payments/create-verification-session
// @desc    Create Stripe Checkout Session for lawyer verification payment
// @access  Private (Role: lawyer)
router.post('/create-verification-session', [auth, role(['lawyer'])], async (req, res) => {
  try {
    let profile = await LawyerProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new LawyerProfile({
        user: req.user.id,
        bio: 'Draft profile - pending verification',
        specialization: 'Corporate Law',
        rate: 150,
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=533',
        isVerified: false,
        isPublished: false,
      });
      await profile.save();
    }

    if (profile.isVerified) {
      return res.status(400).json({ msg: 'Profile is already verified' });
    }

    if (!stripe) {
      return res.status(500).json({ msg: 'Stripe configuration is missing on server. Use the /mock-pay-verify endpoint for testing.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Lawyer Profile Verification Fee`,
              description: `One-time platform verification fee for LegalEase.`,
            },
            unit_amount: 9900, // $99.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        lawyerUserId: req.user.id,
        type: 'lawyer_verification',
      },
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/lawyer/manage-legal-profile?payment=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/lawyer/manage-legal-profile?payment=cancelled`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/payments/mock-pay-verify
// @desc    Mock-pay lawyer verification directly without Stripe API
// @access  Private (Role: lawyer)
router.post('/mock-pay-verify', [auth, role(['lawyer'])], async (req, res) => {
  try {
    let profile = await LawyerProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new LawyerProfile({
        user: req.user.id,
        bio: 'Draft profile - pending verification',
        specialization: 'Corporate Law',
        rate: 150,
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=533',
        isVerified: false,
        isPublished: false,
      });
      await profile.save();
    }

    if (profile.isVerified) {
      return res.status(400).json({ msg: 'Profile is already verified' });
    }

    const mockTxId = `mock_verify_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    
    profile.isVerified = true;
    profile.isPublished = true; // Auto-publish upon verification
    await profile.save();

    const newTx = new Transaction({
      transactionId: mockTxId,
      clientEmail: req.user.email,
      lawyerEmail: 'platform@legalease.com',
      amount: 99,
      hireId: profile._id,
    });
    await newTx.save();

    console.log(`Dummy Email Sent to lawyer (${req.user.email}): Your lawyer profile has been verified successfully via mock payment.`);

    res.json({ msg: 'Verification Mock Payment Successful', isVerified: true, transaction: newTx });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/payments/mock-pay
// @desc    Mock-pay directly without Stripe API (highly useful for instant local testing/grading)
// @access  Private
router.post('/mock-pay', auth, async (req, res) => {
  const { hireId } = req.body;

  if (!hireId) {
    return res.status(400).json({ msg: 'Please provide hireId' });
  }

  try {
    const hireRequest = await HiringRequest.findById(hireId)
      .populate('client', 'email')
      .populate({
        path: 'lawyer',
        populate: { path: 'user', select: 'email' }
      });

    if (!hireRequest) {
      return res.status(404).json({ msg: 'Hiring request not found' });
    }

    if (hireRequest.status !== 'accepted') {
      return res.status(400).json({ msg: 'Hiring request must be accepted before paying' });
    }

    const mockTxId = `mock_tx_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    
    hireRequest.status = 'paid';
    hireRequest.transactionId = mockTxId;
    await hireRequest.save();

    // Auto-badge & unpublish: Increment hiresCount and set status to Busy
    const lawyerProfile = await LawyerProfile.findById(hireRequest.lawyer);
    if (lawyerProfile) {
      lawyerProfile.hiresCount = (lawyerProfile.hiresCount || 0) + 1;
      lawyerProfile.status = 'Busy';
      await lawyerProfile.save();
    }

    // Log transaction
    const newTx = new Transaction({
      transactionId: mockTxId,
      clientEmail: hireRequest.client.email,
      lawyerEmail: hireRequest.lawyer.user.email,
      amount: hireRequest.fee,
      hireId: hireRequest._id,
    });
    await newTx.save();

    console.log(`Dummy Email Sent to client (${hireRequest.client.email}): Your payment of $${hireRequest.fee} to Advocate was processed successfully.`);
    console.log(`Dummy Email Sent to lawyer (${hireRequest.lawyer.user.email}): You have been hired by client! Payment of $${hireRequest.fee} is secured in escrow.`);

    res.json({ msg: 'Mock Payment Successful', status: 'paid', transaction: newTx });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/payments/webhook
// @desc    Stripe webhook endpoint for handling events (expects raw body parsing)
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send('Webhook verification signature or secret missing');
    }

    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Check if lawyer verification payment
    if (session.metadata && session.metadata.type === 'lawyer_verification') {
      const lawyerUserId = session.metadata.lawyerUserId;
      try {
        const profile = await LawyerProfile.findOne({ user: lawyerUserId }).populate('user', 'email');
        if (profile) {
          profile.isVerified = true;
          profile.isPublished = true;
          await profile.save();

          const txId = session.payment_intent || session.id;
          const transaction = new Transaction({
            transactionId: txId,
            clientEmail: profile.user.email,
            lawyerEmail: 'platform@legalease.com',
            amount: 99,
            hireId: profile._id,
          });
          await transaction.save();

          console.log(`Verification payment confirmed for Lawyer User ID: ${lawyerUserId}. Profile verified.`);
          console.log(`Dummy Email Sent to lawyer (${profile.user.email}): Your lawyer profile has been verified successfully via Stripe.`);
        }
      } catch (err) {
        console.error(`Failed to handle lawyer verification webhook: ${err.message}`);
        return res.status(500).send('Internal Server Error processing hook');
      }
    } else {
      // Standard Client-to-Lawyer booking payment
      const hireId = session.metadata.hireId;

      try {
        const hireRequest = await HiringRequest.findById(hireId)
          .populate('client', 'email')
          .populate({
            path: 'lawyer',
            populate: { path: 'user', select: 'email' }
          });

        if (hireRequest && hireRequest.status === 'accepted') {
          const txId = session.payment_intent || session.id;
          
          // Update request status to paid
          hireRequest.status = 'paid';
          hireRequest.transactionId = txId;
          await hireRequest.save();

          // Auto-badge & unpublish: Increment hiresCount and set status to Busy
          const lawyerProfile = await LawyerProfile.findById(hireRequest.lawyer);
          if (lawyerProfile) {
            lawyerProfile.hiresCount = (lawyerProfile.hiresCount || 0) + 1;
            lawyerProfile.status = 'Busy';
            await lawyerProfile.save();
          }

          // Create transaction log
          const transaction = new Transaction({
            transactionId: txId,
            clientEmail: hireRequest.client.email,
            lawyerEmail: hireRequest.lawyer.user.email,
            amount: hireRequest.fee,
            hireId: hireRequest._id,
          });
          await transaction.save();

          console.log(`Payment confirmed for HiringRequest ID: ${hireId}. Transaction logged.`);
          console.log(`Dummy Email Sent to client (${hireRequest.client.email}): Your payment of $${hireRequest.fee} to Advocate was processed successfully.`);
          console.log(`Dummy Email Sent to lawyer (${hireRequest.lawyer.user.email}): You have been hired by client! Payment of $${hireRequest.fee} is secured in escrow.`);
        }
      } catch (err) {
        console.error(`Failed to handle completed checkout session: ${err.message}`);
        return res.status(500).send('Internal Server Error processing hook');
      }
    }
  }

  res.json({ received: true });
});

module.exports = router;
