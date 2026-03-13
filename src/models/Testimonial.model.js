const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    // ── Bilingual fields ───────────────────────────────────────────────────
    name: {
      en: {
        type: String,
        required: [true, 'Name (en) is required'],
        trim: true,
      },
      ar: {
        type: String,
        required: [true, 'Name (ar) is required'],
        trim: true,
      },
    },
    position: {
      en: {
        type: String,
        required: [true, 'Position (en) is required'],
        trim: true,
      },
      ar: {
        type: String,
        required: [true, 'Position (ar) is required'],
        trim: true,
      },
    },
    company: {
      en: {
        type: String,
        required: [true, 'Company (en) is required'],
        trim: true,
      },
      ar: {
        type: String,
        required: [true, 'Company (ar) is required'],
        trim: true,
      },
    },
    content: {
      en: {
        type: String,
        required: [true, 'Testimonial content (en) is required'],
        trim: true,
      },
      ar: {
        type: String,
        required: [true, 'Testimonial content (ar) is required'],
        trim: true,
      },
    },

    // ── Non-translatable fields (unchanged) ───────────────────────────────
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
      default: 5,
    },
    avatar: {
      type: String, // initials or image URL
      trim: true,
    },
    avatarColor: {
      type: String,
      default: '#4F46E5',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);