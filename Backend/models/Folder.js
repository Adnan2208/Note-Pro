const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null
    },
    path: {
      type: String,
      default: '/'
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
folderSchema.index({ user: 1, parent: 1 });
folderSchema.index({ user: 1, path: 1 });

// Pre-save middleware to update path
folderSchema.pre('save', async function(next) {
  if (this.isModified('parent') || this.isModified('name')) {
    if (this.parent) {
      const parentFolder = await this.constructor.findById(this.parent);
      if (parentFolder) {
        this.path = parentFolder.path === '/' 
          ? `/${parentFolder.name}` 
          : `${parentFolder.path}/${parentFolder.name}`;
      }
    } else {
      this.path = '/';
    }
  }
  next();
});

module.exports = mongoose.model('Folder', folderSchema);
