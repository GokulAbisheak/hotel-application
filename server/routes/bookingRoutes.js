const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBooking,
  updateBooking,
  cancelBooking,
  deleteBooking,
  getAllBookings
} = require('../controllers/bookingController');
const auth = require('../middleware/auth');

router.post('/', auth, createBooking);
router.get('/mybookings', auth, getUserBookings);
router.get('/:id', auth, getBooking);
router.put('/:id', auth, updateBooking);
router.delete('/:id', auth, deleteBooking);
router.get('/', auth, getAllBookings);

module.exports = router; 