const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    // ── Bilingual fields ───────────────────────────────────────────────────
    name: {
      en: {
        type: String,
        required: [true, 'Member name (en) is required'],
        trim: true,
        maxlength: [80, 'Name (en) cannot exceed 80 characters'],
      },
      ar: {
        type: String,
        required: [true, 'Member name (ar) is required'],
        trim: true,
        maxlength: [80, 'Name (ar) cannot exceed 80 characters'],
      },
    },
    position: {
      en: {
        type: String,
        required: [true, 'Position (en) is required'],
        trim: true,
        maxlength: [100, 'Position (en) cannot exceed 100 characters'],
      },
      ar: {
        type: String,
        required: [true, 'Position (ar) is required'],
        trim: true,
        maxlength: [100, 'Position (ar) cannot exceed 100 characters'],
      },
    },
    bio: {
      en: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio (en) cannot exceed 500 characters'],
      },
      ar: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio (ar) cannot exceed 500 characters'],
      },
    },

    // ── Non-translatable fields (unchanged) ───────────────────────────────
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