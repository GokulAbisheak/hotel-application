const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getUserOrders,
  deleteOrder
} = require('../controllers/orderController');

// All routes are protected
router.use(protect);

// User routes
router.get('/my-orders', getUserOrders);
router.post('/', createOrder);
router.get('/:id', getOrder);

// Admin routes
router.get('/', getOrders);
router.patch('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);

module.exports = router; 