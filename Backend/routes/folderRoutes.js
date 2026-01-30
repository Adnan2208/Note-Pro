const express = require('express');
const router = express.Router();
const {
  createFolder,
  getFolders,
  getAllFolders,
  getFolderContents,
  updateFolder,
  deleteFolder
} = require('../controllers/folderController');
const { validateAccessCodeMiddleware } = require('../middleware/authMiddleware');

// All routes require valid access code
router.use(validateAccessCodeMiddleware);

// POST /api/folders - Create a new folder
router.post('/', createFolder);

// GET /api/folders - Get root level folders
router.get('/', getFolders);

// GET /api/folders/all - Get all folders
router.get('/all', getAllFolders);

// GET /api/folders/:id/contents - Get folder contents
router.get('/:id/contents', getFolderContents);

// PUT /api/folders/:id - Update a folder
router.put('/:id', updateFolder);

// DELETE /api/folders/:id - Delete a folder
router.delete('/:id', deleteFolder);

module.exports = router;
