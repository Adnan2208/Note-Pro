const Folder = require('../models/Folder');
const Note = require('../models/Note');

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
const createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Folder name is required'
      });
    }

    // If parentId provided, verify it exists and belongs to user
    if (parentId) {
      const parentFolder = await Folder.findOne({ _id: parentId, user: userId });
      if (!parentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found'
        });
      }
    }

    const folder = await Folder.create({
      user: userId,
      name,
      parent: parentId || null
    });

    res.status(201).json({
      success: true,
      folder,
      message: 'Folder created successfully'
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create folder'
    });
  }
};

// @desc    Get all folders for a user
// @route   GET /api/folders
// @access  Private
const getFolders = async (req, res) => {
  try {
    const userId = req.userId;
    const { parentId } = req.query;

    const query = { user: userId };
    if (parentId) {
      query.parent = parentId;
    } else {
      query.parent = null; // Root level folders
    }

    const folders = await Folder.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: folders.length,
      folders
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folders'
    });
  }
};

// @desc    Get all folders (tree structure)
// @route   GET /api/folders/all
// @access  Private
const getAllFolders = async (req, res) => {
  try {
    const userId = req.userId;
    const folders = await Folder.find({ user: userId }).sort({ path: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: folders.length,
      folders
    });
  } catch (error) {
    console.error('Error fetching all folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folders'
    });
  }
};

// @desc    Get folder contents (subfolders and notes)
// @route   GET /api/folders/:id/contents
// @access  Private
const getFolderContents = async (req, res) => {
  try {
    const userId = req.userId;
    const folderId = req.params.id;

    // For root folder, use null
    const parentQuery = folderId === 'root' ? null : folderId;

    // Get subfolders
    const folders = await Folder.find({ 
      user: userId, 
      parent: parentQuery 
    }).sort({ name: 1 });

    // Get notes in this folder
    const notes = await Note.find({ 
      user: userId, 
      folder: parentQuery 
    }).sort({ isPinned: -1, createdAt: -1 });

    // Get current folder info (if not root)
    let currentFolder = null;
    if (folderId !== 'root') {
      currentFolder = await Folder.findOne({ _id: folderId, user: userId });
      if (!currentFolder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
    }

    res.status(200).json({
      success: true,
      currentFolder,
      folders,
      notes
    });
  } catch (error) {
    console.error('Error fetching folder contents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folder contents'
    });
  }
};

// @desc    Update a folder
// @route   PUT /api/folders/:id
// @access  Private
const updateFolder = async (req, res) => {
  try {
    const userId = req.userId;
    const folderId = req.params.id;
    const { name } = req.body;

    const folder = await Folder.findOne({ _id: folderId, user: userId });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    if (name) folder.name = name;
    await folder.save();

    res.status(200).json({
      success: true,
      folder,
      message: 'Folder updated successfully'
    });
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update folder'
    });
  }
};

// @desc    Delete a folder and all its contents
// @route   DELETE /api/folders/:id
// @access  Private
const deleteFolder = async (req, res) => {
  try {
    const userId = req.userId;
    const folderId = req.params.id;

    const folder = await Folder.findOne({ _id: folderId, user: userId });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found'
      });
    }

    // Recursively delete all subfolders and notes
    await deleteFolderRecursive(folderId, userId);

    res.status(200).json({
      success: true,
      message: 'Folder and all contents deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete folder'
    });
  }
};

// Helper function to recursively delete folder contents
const deleteFolderRecursive = async (folderId, userId) => {
  // Find all subfolders
  const subfolders = await Folder.find({ parent: folderId, user: userId });
  
  // Recursively delete subfolders
  for (const subfolder of subfolders) {
    await deleteFolderRecursive(subfolder._id, userId);
  }

  // Delete all notes in this folder
  await Note.deleteMany({ folder: folderId, user: userId });

  // Delete the folder itself
  await Folder.findByIdAndDelete(folderId);
};

module.exports = {
  createFolder,
  getFolders,
  getAllFolders,
  getFolderContents,
  updateFolder,
  deleteFolder
};
