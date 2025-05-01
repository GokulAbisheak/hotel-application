const stripe = require('../config/stripe');
const Booking = require('../models/Booking');
const Order = require('../models/Order');

// @desc    Create payment intent for booking
// @route   POST /api/payments/booking-intent
// @access  Private
exports.createBookingPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Calculate amount in cents
    const amount = Math.round(booking.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'inr',
      payment_method_types: ['card'],
      metadata: {
        bookingId: booking._id.toString(),
        userId: booking.user.toString()
      },
      receipt_email: req.user.email,
      shipping: {
        name: req.user.name,
        address: {
          line1: req.user.address || 'Not provided',
          city: req.user.city || 'Not provided',
          state: req.user.state || 'Not provided',
          postal_code: 10001,
          country: 'US'
        }
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create payment intent for order
// @route   POST /api/payments/order-intent
// @access  Private
exports.createOrderPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Calculate amount in cents
    const amount = Math.round(order.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'inr',
      payment_method_types: ['card'],
      metadata: {
        orderId: order._id.toString(),
        userId: order.user.toString()
      },
      receipt_email: req.user.email,
      shipping: {
        name: req.user.name,
        address: {
          line1: req.user.address || 'Not provided',
          city: req.user.city || 'Not provided',
          state: req.user.state || 'Not provided',
          postal_code: 10001,
          country: 'US'
        }
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Confirm payment and update status
// @route   POST /api/payments/confirm
// @access  Private
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, type, id } = req.body;
    
    // Verify the payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Update the booking or order based on type
    if (type === 'booking') {
      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
      }
      
      booking.paymentStatus = 'paid';
      booking.paymentId = paymentIntentId;
      await booking.save();
    } else if (type === 'order') {
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      order.paymentStatus = 'paid';
      order.paymentId = paymentIntentId;
      await order.save();
    }

    res.status(200).json({ message: 'Payment confirmed successfully' });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(400).json({ message: error.message });
  }
}; 