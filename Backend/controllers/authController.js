const User = require('../models/User');

// @desc    Create a new access code
// @route   POST /api/auth/create
// @access  Public
const createAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({
        success: false,
        message: 'Access code is required'
      });
    }

    // Validate 6 digits
    if (!/^[0-9]{6}$/.test(accessCode)) {
      return res.status(400).json({
        success: false,
        message: 'Access code must be exactly 6 digits'
      });
    }

    // Check if access code already exists
    const existingUser = await User.findOne({ accessCode });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Access code already exists. Please choose a different one.'
      });
    }

    const user = await User.create({ accessCode });
    
    res.status(201).json({
      success: true,
      accessCode: user.accessCode,
      message: 'Access code created successfully'
    });
  } catch (error) {
    console.error('Error creating access code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create access code'
    });
  }
};

// @desc    Validate an access code
// @route   POST /api/auth/validate
// @access  Public
const validateAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({
        success: false,
        message: 'Access code is required'
      });
    }

    const user = await User.findOne({ 
      accessCode: accessCode.toUpperCase(),
      isActive: true 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid access code'
      });
    }

    // Update last accessed time
    await user.updateLastAccessed();

    res.status(200).json({
      success: true,
      userId: user._id,
      accessCode: user.accessCode,
      message: 'Access code validated successfully'
    });
  } catch (error) {
    console.error('Error validating access code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate access code'
    });
  }
};

// @desc    Deactivate an access code
// @route   DELETE /api/auth/deactivate
// @access  Public
const deactivateAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({
        success: false,
        message: 'Access code is required'
      });
    }

    const user = await User.findOneAndUpdate(
      { accessCode: accessCode.toUpperCase() },
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Access code not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Access code deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating access code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate access code'
    });
  }
};

module.exports = {
  createAccessCode,
  validateAccessCode,
  deactivateAccessCode
};
