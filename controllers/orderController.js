const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Menu = require('../models/Menu');

// Validation rules
const orderValidation = [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be positive'),
  body('deliveryOption')
    .isIn(['dine-in', 'takeaway', 'delivery'])
    .withMessage('Invalid delivery option')
];

// Place order (User)
exports.placeOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, totalAmount, tableNumber, deliveryOption } = req.body;

    // Validate items exist
    for (const item of items) {
      const menuItem = await Menu.findById(item.itemId);
      if (!menuItem) {
        return res.status(404).json({ 
          message: `Menu item ${item.name} not found` 
        });
      }
    }

    const order = new Order({
      userId: req.user.id,
      items,
      totalAmount,
      tableNumber: deliveryOption === 'dine-in' ? tableNumber : null,
      deliveryOption,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    await order.save();
    
    // Emit socket event for real-time updates
    if (global.io) {
      global.io.emit('order:new', {
        orderId: order._id,
        message: `New order #${order._id.toString().slice(-6)}`
      });
    }

    res.status(201).json({
      message: 'Order placed successfully',
      orderId: order._id,
      data: order
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error placing order',
      error: error.message 
    });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.itemId', 'name price')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching orders',
      error: error.message 
    });
  }
};

// Get all orders (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    let filter = {};
    
    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .populate('items.itemId', 'name price category')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching orders',
      error: error.message 
    });
  }
};

// Update order status (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    if (!['pending', 'preparing', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, paymentStatus },
      { new: true }
    ).populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Emit socket event for real-time updates
    if (global.io) {
      global.io.emit('order:updated', {
        orderId: order._id,
        status: order.status,
        message: `Order #${order._id.toString().slice(-6)} status: ${status}`
      });
    }

    res.json({
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating order',
      error: error.message 
    });
  }
};

// Get order analytics (Admin)
exports.getOrderAnalytics = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    
    // Total revenue
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Top selling items
    const topItems = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { 
          _id: '$items.itemId', 
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        } 
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: 'menus',
          localField: '_id',
          foreignField: '_id',
          as: 'itemDetails'
        }
      }
    ]);

    // Daily sales
    const dailySales = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    res.json({
      totalOrders,
      completedOrders,
      pendingOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      topSellingItems: topItems,
      dailySales
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching analytics',
      error: error.message 
    });
  }
};

// Get single order (User/Admin)
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('items.itemId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching order',
      error: error.message 
    });
  }
};

// Export functions and validation
exports.orderValidation = orderValidation;