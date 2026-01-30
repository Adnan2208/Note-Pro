const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    accessCode: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4().split('-')[0].toUpperCase()
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Update lastAccessed on validation
userSchema.methods.updateLastAccessed = async function () {
  this.lastAccessed = Date.now();
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
