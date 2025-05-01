const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  amenities: {
    type: [String],
    default: [],
  },
  image: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
