const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

// Protected routes
router.use(auth.protect);

// Get all bookings (admin only)
router.get('/', bookingController.getAllBookings);

// Get user's bookings
router.get('/mybookings', bookingController.getUserBookings);

// Create booking
router.post('/', bookingController.createBooking);

// Create manual booking
router.post('/manual', bookingController.createManualBooking);

// Get single booking
router.get('/:id', bookingController.getBooking);

// Update booking
router.put('/:id', bookingController.updateBooking);

// Delete booking
router.delete('/:id', bookingController.deleteBooking);

module.exports = router; 