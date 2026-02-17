const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
      maxlength: [100, 'Position cannot exceed 100 characters'],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    photo: {
      type: String,
      required: [true, 'Member photo is required'],
    },
    socialLinks: {
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
      twitter: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    skills: [{ type: String, trim: true }],
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

teamMemberSchema.index({ isPublished: 1, order: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
