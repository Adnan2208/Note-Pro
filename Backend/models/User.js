const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    accessCode: {
      type: String,
      required: true,
      unique: true,
      minlength: 6,
      maxlength: 6,
      validate: {
        validator: function(v) {
          return /^[0-9]{6}$/.test(v);
        },
        message: 'Access code must be exactly 6 digits'
      }
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
