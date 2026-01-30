const express = require('express');
const router = express.Router();
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
} = require('../controllers/noteController');
const { validateAccessCodeMiddleware } = require('../middleware/authMiddleware');

// All routes require valid access code
router.use(validateAccessCodeMiddleware);

// POST /api/notes - Create a new note
router.post('/', createNote);

// GET /api/notes - Get all notes for user
router.get('/', getNotes);

// GET /api/notes/:id - Get a single note
router.get('/:id', getNoteById);

// PUT /api/notes/:id - Update a note
router.put('/:id', updateNote);

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', deleteNote);

module.exports = router;
