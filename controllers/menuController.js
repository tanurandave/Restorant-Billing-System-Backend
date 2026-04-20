const { body, validationResult } = require('express-validator');
const Menu = require('../models/Menu');

// Validation rules
const menuValidation = [
  body('name').trim().notEmpty().withMessage('Menu item name is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isIn(['Veg', 'Non-Veg', 'Drinks'])
    .withMessage('Category must be Veg, Non-Veg, or Drinks'),
  body('image').optional().isURL().withMessage('Invalid image URL')
];

// Get all menu items (public)
exports.getMenu = async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let filter = { available: true };
    
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const menu = await Menu.find(filter).sort({ createdAt: -1 });
    
    res.json(menu);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching menu',
      error: error.message 
    });
  }
};

// Add menu item (admin only)
exports.addMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const menuItem = new Menu(req.body);
    await menuItem.save();
    
    res.status(201).json({
      message: 'Menu item added successfully',
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error adding menu item',
      error: error.message 
    });
  }
};

// Update menu item (admin only)
exports.updateMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const menuItem = await Menu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating menu item',
      error: error.message 
    });
  }
};

// Delete menu item (admin only)
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await Menu.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({ 
      message: 'Menu item deleted successfully',
      data: menuItem 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting menu item',
      error: error.message 
    });
  }
};

// Get menu analytics
exports.getMenuAnalytics = async (req, res) => {
  try {
    const totalItems = await Menu.countDocuments();
    const itemsByCategory = await Menu.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const availableItems = await Menu.countDocuments({ available: true });

    res.json({
      totalItems,
      availableItems,
      unavailableItems: totalItems - availableItems,
      itemsByCategory
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching analytics',
      error: error.message 
    });
  }
};

// Export functions and validation
exports.menuValidation = menuValidation;