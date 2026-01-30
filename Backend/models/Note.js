const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true
    },
    images: [
      {
        id: String,
        data: String, // Base64 encoded image
        mimeType: String,
        name: String
      }
    ],
    isPinned: {
      type: Boolean,
      default: false
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

// Index for faster queries by user
noteSchema.index({ user: 1, folder: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
