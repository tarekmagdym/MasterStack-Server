const Testimonial = require('../models/Testimonial.model');
const { createSystemNotification } = require('./Notification.controller');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getLang = (req) => {
  const lang = (req.headers['accept-language'] || '').toLowerCase().trim();
  return lang === 'ar' ? 'ar' : 'en';
};

const localizeDoc = (doc, lang) => {
  const i18nFields = ['name', 'position', 'company', 'content', 'title', 'description'];
  i18nFields.forEach((field) => {
    if (doc[field] && typeof doc[field] === 'object' && !Array.isArray(doc[field])) {
      doc[field] = doc[field][lang] || doc[field]['en'] || '';
    }
  });
  return doc;
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc   Get all active testimonials (public)
 * @route  GET /api/testimonials
 * @access Public
 */
const getTestimonials = async (req, res) => {
  try {
    const lang = getLang(req);

    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const localized = testimonials.map((t) => localizeDoc(t, lang));

    res.status(200).json({
      success: true,
      lang,
      count: localized.length,
      data:  localized,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES — return raw { ar, en } objects so the dashboard can edit both
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc   Get all testimonials (admin - includes inactive)
 * @route  GET /api/testimonials/all
 * @access Private (Admin)
 */
const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data:  testimonials,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Get single testimonial by ID (admin)
 * @route  GET /api/testimonials/:id
 * @access Private (Admin)
 */
const getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    res.status(200).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Create testimonial
 * @route  POST /api/testimonials
 * @access Private (Admin)
 */
const createTestimonial = async (req, res) => {
  try {
    const { name, position, company, content, rating, avatar, avatarColor, isActive, order } = req.body;

    const testimonial = await Testimonial.create({
      name, position, company, content, rating, avatar, avatarColor, isActive, order,
    });

    // ✅ Broadcast — all admins notified of new testimonial
    await createSystemNotification({
      title:        'New Testimonial Added',
      titleAr:      'تمت إضافة تقييم جديد',
      message:      `A new testimonial from "${name?.en || name || 'Unknown'}" has been added.`,
      messageAr:    `تمت إضافة تقييم جديد من "${name?.ar || name?.en || 'غير معروف'}".`,
      type:         'success',
      resourceType: 'User',
      resourceId:   testimonial._id,
      recipient:    null,
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data:    testimonial,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Update testimonial
 * @route  PUT /api/testimonials/:id
 * @access Private (Admin)
 */
const updateTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    // ✅ Broadcast — all admins notified of testimonial update
    await createSystemNotification({
      title:        'Testimonial Updated',
      titleAr:      'تم تحديث تقييم',
      message:      `Testimonial from "${testimonial.name?.en || testimonial.name || 'Unknown'}" has been updated.`,
      messageAr:    `تم تحديث تقييم "${testimonial.name?.ar || testimonial.name?.en || 'غير معروف'}".`,
      type:         'info',
      resourceType: 'User',
      resourceId:   testimonial._id,
      recipient:    null,
    });

    res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      data:    testimonial,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc   Delete testimonial
 * @route  DELETE /api/testimonials/:id
 * @access Private (Admin)
 */
const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found' });
    }

    // ✅ Broadcast — all admins notified of testimonial deletion
    await createSystemNotification({
      title:        'Testimonial Deleted',
      titleAr:      'تم حذف تقييم',
      message:      `Testimonial from "${testimonial.name?.en || testimonial.name || 'Unknown'}" has been permanently deleted.`,
      messageAr:    `تم حذف تقييم "${testimonial.name?.ar || testimonial.name?.en || 'غير معروف'}" بشكل نهائي.`,
      type:         'warning',
      resourceType: 'User',
      resourceId:   testimonial._id,
      recipient:    null,
    });

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTestimonials,
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};