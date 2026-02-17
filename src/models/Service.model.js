const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
    },
    icon: {
      type: String,
      required: [true, 'Service icon is required'],
    },
    features: [{ type: String, trim: true }],
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

serviceSchema.index({ isPublished: 1, order: 1 });

module.exports = mongoose.model('Service', serviceSchema);
