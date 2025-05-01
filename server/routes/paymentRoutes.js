const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createBookingPaymentIntent,
  createOrderPaymentIntent,
  confirmPayment
} = require('../controllers/paymentController');

// Create payment intent for booking
router.post('/booking-intent', protect, createBookingPaymentIntent);

// Create payment intent for order
router.post('/order-intent', protect, createOrderPaymentIntent);

// Confirm payment and update status
router.post('/confirm', protect, confirmPayment);

module.exports = router; 