require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// 1. Stripe Webhook Route (MUST run before general express.json() parser to receive raw request bodies)
app.use('/api/payments/webhook', require('./routes/payments'));

// 2. General Middlewares for all other routes
app.use(express.json());
app.use(morgan('dev'));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health status check endpoint for Render.com verification
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'LegalEase Online Lawyer Hiring Platform Server API is online & operational',
    timestamp: new Date()
  });
});

// Bind Controller Routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lawyers', require('./routes/lawyers'));
app.use('/api/hires', require('./routes/hires'));
app.use('/api/payments', require('./routes/payments')); // Checkout & Mock-pay
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));

// Catch-all 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({ msg: `Endpoint ${req.originalUrl} not found` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
