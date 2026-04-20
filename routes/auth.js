const express = require('express');
const { signup, login, getMe, signupValidation, loginValidation } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', verifyToken, getMe);

module.exports = router;