const express = require('express');
const { 
  placeOrder, 
  getUserOrders, 
  getAllOrders, 
  updateOrderStatus, 
  getOrder,
  getOrderAnalytics,
  orderValidation 
} = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// User routes
router.post('/', verifyToken, orderValidation, placeOrder);
router.get('/user', verifyToken, getUserOrders);
router.get('/:id', verifyToken, getOrder);

// Admin routes
router.get('/', verifyToken, verifyAdmin, getAllOrders);
router.put('/:id', verifyToken, verifyAdmin, updateOrderStatus);

// Analytics routes
router.get('/analytics/summary', verifyToken, verifyAdmin, getOrderAnalytics);

module.exports = router;