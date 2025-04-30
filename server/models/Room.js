const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
