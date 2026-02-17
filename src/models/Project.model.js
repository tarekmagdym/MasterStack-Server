const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    shortDescription: {
      type: String,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    thumbnail: {
      type: String,
      required: [true, 'Project thumbnail is required'],
    },
    images: [{ type: String }],
    technologies: [{ type: String, trim: true }],
    category: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true,
    },
    clientName: { type: String, trim: true },
    projectUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    completionDate: { type: Date },
    isFeatured: {
      type: Boolean,
      default: false,
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

// Auto-generate slug from title
projectSchema.pre('save', async function () {
  if (this.isModified('title') || this.isNew) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});


// Index for performance
projectSchema.index({ isFeatured: 1, isPublished: 1 });
projectSchema.index({ category: 1, isPublished: 1 });

module.exports = mongoose.model('Project', projectSchema);
