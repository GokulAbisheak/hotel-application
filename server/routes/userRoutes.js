const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleCheckIn
} = require('../controllers/userController');

// Protect all routes
router.use(protect);

// Admin only routes
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/:id/check-in', toggleCheckIn);

module.exports = router; 