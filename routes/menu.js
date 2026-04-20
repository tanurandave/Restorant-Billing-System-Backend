const express = require('express');
const { 
  getMenu, 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  getMenuAnalytics,
  menuValidation 
} = require('../controllers/menuController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getMenu);

// Admin routes
router.post('/', verifyToken, verifyAdmin, menuValidation, addMenuItem);
router.put('/:id', verifyToken, verifyAdmin, menuValidation, updateMenuItem);
router.delete('/:id', verifyToken, verifyAdmin, deleteMenuItem);

// Analytics routes
router.get('/analytics/summary', verifyToken, verifyAdmin, getMenuAnalytics);

module.exports = router;