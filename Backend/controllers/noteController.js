const Note = require('../models/Note');
const User = require('../models/User');

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private (requires valid access code)
const createNote = async (req, res) => {
  try {
    const { title, content, tags, isPinned, folderId } = req.body;
    const userId = req.userId;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Verify folder exists if provided
    if (folderId) {
      const Folder = require('../models/Folder');
      const folder = await Folder.findOne({ _id: folderId, user: userId });
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
    }

    const note = await Note.create({
      user: userId,
      folder: folderId || null,
      title,
      content,
      tags: tags || [],
      isPinned: isPinned || false
    });

    res.status(201).json({
      success: true,
      note,
      message: 'Note created successfully'
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note'
    });
  }
};

// @desc    Get all notes for a user
// @route   GET /api/notes
// @access  Private (requires valid access code)
const getNotes = async (req, res) => {
  try {
    const userId = req.userId;

    const notes = await Note.find({ user: userId })
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes'
    });
  }
};

// @desc    Get a single note
// @route   GET /api/notes/:id
// @access  Private (requires valid access code)
const getNoteById = async (req, res) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;

    const note = await Note.findOne({ _id: noteId, user: userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      note
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch note'
    });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private (requires valid access code)
const updateNote = async (req, res) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;
    const { title, content, tags, isPinned } = req.body;

    const note = await Note.findOne({ _id: noteId, user: userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Update fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (isPinned !== undefined) note.isPinned = isPinned;

    await note.save();

    res.status(200).json({
      success: true,
      note,
      message: 'Note updated successfully'
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note'
    });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private (requires valid access code)
const deleteNote = async (req, res) => {
  try {
    const userId = req.userId;
    const noteId = req.params.id;

    const note = await Note.findOneAndDelete({ _id: noteId, user: userId });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note'
    });
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
};
