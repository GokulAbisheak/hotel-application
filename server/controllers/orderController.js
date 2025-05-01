const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    // Build search query
    const searchQuery = {
      ...(search && {
        $or: [
          { _id: { $regex: search, $options: 'i' } },
          { 'user.name': { $regex: search, $options: 'i' } },
          { roomNumber: { $regex: search, $options: 'i' } }
        ]
      }),
      ...(status && status !== 'all' && { status })
    };

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalOrders / limit);

    // Get paginated orders
    const orders = await Order.find(searchQuery)
      .populate('user', 'name email')
      .populate('items.food', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.food', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if user is admin or the order belongs to the user
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    // Check if user is checked in
    const user = await User.findById(req.user.id);
    if (!user.checkedIn) {
      return res.status(400).json({
        success: false,
        error: 'User must be checked in to place an order'
      });
    }

    // Add user to request body
    req.body.user = req.user.id;
    
    const order = await Order.create(req.body);
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    if (!['pending', 'preparing', 'ready', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: pending, preparing, ready, delivered, cancelled'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.food', 'name price');

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update order status'
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.food', 'name price')
      .sort({ createdAt: -1 }); // Sort by newest first
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    await order.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
}; 