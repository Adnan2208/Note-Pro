const express = require('express');
const router = express.Router();
const {
  createAccessCode,
  validateAccessCode,
  deactivateAccessCode
} = require('../controllers/authController');

// POST /api/auth/create - Create a new access code
router.post('/create', createAccessCode);

// POST /api/auth/validate - Validate an access code
router.post('/validate', validateAccessCode);

// DELETE /api/auth/deactivate - Deactivate an access code
router.delete('/deactivate', deactivateAccessCode);

module.exports = router;
