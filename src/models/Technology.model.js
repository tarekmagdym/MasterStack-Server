const mongoose = require('mongoose');

const technologySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Technology name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    logo: {
      type: String,
      required: [true, 'Technology logo is required'],
    },
    category: {
      type: String,
      required: [true, 'Technology category is required'],
      enum: ['frontend', 'backend', 'database', 'devops', 'mobile', 'tools', 'other'],
    },
    proficiencyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

technologySchema.index({ category: 1, isPublished: 1 });

module.exports = mongoose.model('Technology', technologySchema);
