const jwt = require('jsonwebtoken');
const { User } = require('../models/Index');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - No token provided',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID from token payload (exclude password)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
      });

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      next(); // Proceed to next middleware/route handler
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - Invalid token',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication',
    });
  }
};

module.exports = { protect };