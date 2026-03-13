const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    // ── Bilingual fields ───────────────────────────────────────────────────
    title: {
      en: { type: String, required: [true, 'Service title (en) is required'], trim: true, maxlength: [100, 'Title (en) cannot exceed 100 characters'] },
      ar: { type: String, required: [true, 'Service title (ar) is required'], trim: true, maxlength: [100, 'Title (ar) cannot exceed 100 characters'] },
    },
    description: {
      en: { type: String, required: [true, 'Service description (en) is required'], maxlength: [1000, 'Description (en) cannot exceed 1000 characters'] },
      ar: { type: String, required: [true, 'Service description (ar) is required'], maxlength: [1000, 'Description (ar) cannot exceed 1000 characters'] },
    },
    shortDescription: {
      en: { type: String, trim: true, maxlength: [200, 'Short description (en) cannot exceed 200 characters'] },
      ar: { type: String, trim: true, maxlength: [200, 'Short description (ar) cannot exceed 200 characters'] },
    },

    // ── Non-translatable fields ────────────────────────────────────────────
    icon:       { type: String, default: '' },          // ← no longer required (empty string allowed)
    features:   [{ type: String, trim: true }],         // English features list
    featuresAr: [{ type: String, trim: true }],         // ← Arabic features list (NEW)

    isPublished: { type: Boolean, default: true },

    /**
     * isFeatured — when true this service appears on the public home page.
     * Toggled independently from isPublished so a service can be
     * "published" (accessible via /services) but not pinned to the home page.
     */
    isFeatured: { type: Boolean, default: false },

    order: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Index covers the public home-page query: featured + published, sorted by order
serviceSchema.index({ isPublished: 1, isFeatured: 1, order: 1 });

module.exports = mongoose.model('Service', serviceSchema);