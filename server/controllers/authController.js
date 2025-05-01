const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, nic, phoneNumber } = req.body;

    // Check if user already exists with email
    const existingUserWithEmail = await User.findOne({ email });
    if (existingUserWithEmail) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email address.' });
    }

    // Check if user already exists with NIC
    const existingUserWithNIC = await User.findOne({ nic });
    if (existingUserWithNIC) {
      return res.status(400).json({ message: 'NIC already exists. Please use a different NIC number.' });
    }

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      nic,
      phoneNumber,
      role: 'user'
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        nic: user.nic,
        phoneNumber: user.phoneNumber,
        role: user.role,
        checkedIn: user.checkedIn
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        checkedIn: user.checkedIn
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 