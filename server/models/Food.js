const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['appetizer', 'main course', 'dessert', 'beverage']
  },
  image: {
    type: String,
    default: 'default-food.jpg'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: Number, // in minutes
    required: [true, 'Preparation time is required'],
    min: [0, 'Preparation time cannot be negative']
  }
}, { timestamps: true });

module.exports = mongoose.model('Food', foodSchema); 