const Booking = require('../models/Booking');
const Room = require('../models/Room');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut } = req.body;
    
    const existingBooking = await Booking.findOne({
      room: roomId,
      $or: [
        { checkIn: { $lte: checkOut }, checkOut: { $gte: checkIn } }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Room is not available for selected dates' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    let days = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    if (days < 1) {
      days = 1;
    }
    
    const totalAmount = room.price * days;

    const booking = await Booking.create({
      user: req.user._id,
      room: roomId,
      checkIn,
      checkOut,
      totalAmount
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Create a new manual booking
exports.createManualBooking = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, userId } = req.body;
    
    const existingBooking = await Booking.findOne({
      room: roomId,
      $or: [
        { checkIn: { $lte: checkOut }, checkOut: { $gte: checkIn } }
      ]
    });

    if (existingBooking) {
      return res.status(400).json({ message: 'Room is not available for selected dates' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    let days = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    if (days < 1) {
      days = 1;
    }
    
    const totalAmount = room.price * days;

    const booking = await Booking.create({
      user: userId,
      room: roomId,
      checkIn,
      checkOut,
      totalAmount
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'room',
        select: 'name price amenities roomNumber'
      })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single booking
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ Update booking (allow updating status too)
exports.updateBooking = async (req, res) => {
  try {
    const { checkIn, checkOut, totalPrice, status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const checkInDate = new Date(checkIn);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

    if (hoursUntilCheckIn < 24 && status !== 'cancelled') {
      return res.status(400).json({ message: 'Cannot update booking within 24 hours of check-in' });
    }

    const existingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      room: booking.room,
      status: 'confirmed',
      $or: [
        { checkIn: { $lte: checkOut }, checkOut: { $gte: checkIn } }
      ]
    });

    if (existingBooking && status !== 'cancelled') {
      return res.status(400).json({ message: 'Room is not available for selected dates' });
    }

    booking.checkIn = checkIn || booking.checkIn;
    booking.checkOut = checkOut || booking.checkOut;
    booking.totalPrice = totalPrice || booking.totalPrice;
    booking.status = status || booking.status; // ✅ Allow status update

    await booking.save();
    await booking.populate('room');

    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cancel booking (still exists but not used separately anymore)
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

    if (hoursUntilCheckIn < 24) {
      return res.status(400).json({ message: 'Cannot cancel booking within 24 hours of check-in' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete bookings' });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all bookings (admin)
exports.getAllBookings = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view all bookings' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalBookings = await Booking.countDocuments();
    const totalPages = Math.ceil(totalBookings / limit);

    const bookings = await Booking.find()
      .populate('user')
      .populate('room')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
    
    res.json({
      bookings,
      pagination: {
        currentPage: page,
        totalPages,
        totalBookings,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
