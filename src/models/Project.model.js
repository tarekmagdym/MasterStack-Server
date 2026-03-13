const mongoose = require('mongoose');

/**
 * i18nString — bilingual { en, ar } sub-schema helper
 */
const i18nString = (opts = {}) => ({
  en: { type: String, trim: true, ...opts },
  ar: { type: String, trim: true, ...opts },
});

const projectSchema = new mongoose.Schema(
  {
    // ── Bilingual fields ───────────────────────────────────────────────────
    title: {
      en: {
        type: String,
        required: [true, 'Project title (en) is required'],
        trim: true,
        maxlength: [100, 'Title (en) cannot exceed 100 characters'],
      },
      ar: {
        type: String,
        required: [true, 'Project title (ar) is required'],
        trim: true,
        maxlength: [100, 'Title (ar) cannot exceed 100 characters'],
      },
    },

    description: {
      en: {
        type: String,
        required: [true, 'Project description (en) is required'],
        maxlength: [2000, 'Description (en) cannot exceed 2000 characters'],
      },
      ar: {
        type: String,
        required: [true, 'Project description (ar) is required'],
        maxlength: [2000, 'Description (ar) cannot exceed 2000 characters'],
      },
    },

    shortDescription: {
      ...i18nString({ maxlength: [300, 'Short description cannot exceed 300 characters'] }),
    },

    /**
     * tags — array of bilingual chip labels shown on the public project card.
     * Each tag has an English and Arabic version.
     * Example: [{ en: 'Web App', ar: 'تطبيق ويب' }, { en: 'Education', ar: 'تعليم' }]
     */
    tags: [
      {
        en: { type: String, trim: true, maxlength: 40 },
        ar: { type: String, trim: true, maxlength: 40 },
        _id: false, // no sub-document _id needed
      },
    ],

    // ── Slug ──────────────────────────────────────────────────────────────
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    // ── Media ─────────────────────────────────────────────────────────────
    /**
     * thumbnail — primary image URL shown on the public card.
     * Maps to `project.image` in the public-facing component.
     */
    thumbnail: {
      type: String,
      required: [true, 'Project thumbnail is required'],
    },
    images: [{ type: String }],

    // ── Tech stack ────────────────────────────────────────────────────────
    technologies: [{ type: String, trim: true }],

    // ── Categorisation ────────────────────────────────────────────────────
    /**
     * category — must match one of the filter IDs on the public page:
     *   'web' | 'mobile' | 'ecommerce' | 'saas'
     */
    category: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true,
      lowercase: true,
      enum: {
        values: ['web', 'mobile', 'ecommerce', 'saas'],
        message: 'Category must be one of: web, mobile, ecommerce, saas',
      },
    },

    // ── Client / URLs ─────────────────────────────────────────────────────
    clientName: { type: String, trim: true },

    /**
     * projectUrl — public live URL of the project.
     * Maps to `project.liveUrl` in the public-facing component.
     */
    projectUrl: { type: String, trim: true },
    githubUrl:  { type: String, trim: true },

    // ── Dates ─────────────────────────────────────────────────────────────
    /**
     * completionDate — full Date stored in DB.
     * The public component extracts just the year: new Date(completionDate).getFullYear()
     * Maps to `project.year` (string) in the public-facing component.
     */
    completionDate: { type: Date },

    // ── Flags ─────────────────────────────────────────────────────────────
    isFeatured:  { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true  },
    order:       { type: Number,  default: 0     },

    // ── Audit ─────────────────────────────────────────────────────────────
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

// ── Pre-save: auto-generate slug from title.en ────────────────────────────────
projectSchema.pre('save', async function () {
  const titleEn = this.title?.en;
  if ((this.isModified('title') || this.isNew) && titleEn) {
    this.slug = titleEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

// ── Indexes ───────────────────────────────────────────────────────────────────
projectSchema.index({ isFeatured: 1, isPublished: 1 });
projectSchema.index({ category: 1, isPublished: 1 });

module.exports = mongoose.model('Project', projectSchema);