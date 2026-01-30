const User = require('../models/User');

// Middleware to validate access code from header
const validateAccessCodeMiddleware = async (req, res, next) => {
  try {
    const accessCode = req.headers['x-access-code'];

    if (!accessCode) {
      return res.status(401).json({
        success: false,
        message: 'Access code is required in headers'
      });
    }

    const user = await User.findOne({
      accessCode: accessCode.toUpperCase(),
      isActive: true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive access code'
      });
    }

    // Attach user ID to request
    req.userId = user._id;
    req.accessCode = user.accessCode;

    // Update last accessed
    user.lastAccessed = Date.now();
    await user.save();

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = { validateAccessCodeMiddleware };
