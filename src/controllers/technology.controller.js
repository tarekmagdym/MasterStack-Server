const Technology  = require('../models/Technology.model');
const ActivityLog = require('../models/ActivityLog.model');
const { createSystemNotification } = require('./Notification.controller');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getLang = (req) => {
  const lang = (req.headers['accept-language'] || '').toLowerCase().trim();
  return lang === 'ar' ? 'ar' : 'en';
};

const localizeDoc = (doc, lang) => {
  const i18nFields = ['name', 'title', 'description'];
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
 * @desc   Get all published technologies (public)
 * @route  GET /api/technologies
 * @access Public
 */
const getTechnologies = async (req, res) => {
  try {
    const lang = getLang(req);
    const { category } = req.query;

    const filter = { isPublished: true };
    if (category) filter.category = category;

    const technologies = await Technology.find(filter)
      .sort({ category: 1, order: 1 })
      .select('-createdBy -updatedBy -__v')
      .lean();

    const localized = technologies.map((t) => localizeDoc(t, lang));

    const grouped = localized.reduce((acc, tech) => {
      if (!acc[tech.category]) acc[tech.category] = [];
      acc[tech.category].push(tech);
      return acc;
    }, {});

    res.status(200).json({ success: true, lang, data: localized, grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc   Get all technologies (admin)
 * @route  GET /api/admin/technologies
 * @access Private
 */
const getAllTechnologiesAdmin = async (req, res) => {
  try {
    const technologies = await Technology.find()
      .sort({ category: 1, order: 1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({ success: true, data: technologies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Create technology
 * @route  POST /api/admin/technologies
 * @access Private (admin+)
 */
const createTechnology = async (req, res) => {
  try {
    const technology = await Technology.create({ ...req.body, createdBy: req.user._id });

    await ActivityLog.create({
      user:          req.user._id,
      action:        'CREATE',
      resourceType:  'Technology',
      resourceId:    technology._id,
      resourceTitle: technology.name?.en || technology.name,
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins notified of new technology
    await createSystemNotification({
      title:        'New Technology Added',
      titleAr:      'تمت إضافة تقنية جديدة',
      message:      `Technology "${technology.name?.en || technology.name || 'Untitled'}" has been added by ${req.user.name}.`,
      messageAr:    `تمت إضافة تقنية "${technology.name?.ar || technology.name?.en || 'بدون اسم'}" بواسطة ${req.user.name}.`,
      type:         'success',
      resourceType: 'Technology',
      resourceId:   technology._id,
      recipient:    null,
    });

    res.status(201).json({ success: true, message: 'Technology created.', data: technology });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Update technology
 * @route  PUT /api/admin/technologies/:id
 * @access Private (admin+)
 */
const updateTechnology = async (req, res) => {
  try {
    const technology = await Technology.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!technology) {
      return res.status(404).json({ success: false, message: 'Technology not found.' });
    }

    await ActivityLog.create({
      user:          req.user._id,
      action:        'UPDATE',
      resourceType:  'Technology',
      resourceId:    technology._id,
      resourceTitle: technology.name?.en || technology.name,
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins notified of technology update
    await createSystemNotification({
      title:        'Technology Updated',
      titleAr:      'تم تحديث تقنية',
      message:      `Technology "${technology.name?.en || technology.name || 'Untitled'}" has been updated by ${req.user.name}.`,
      messageAr:    `تم تحديث تقنية "${technology.name?.ar || technology.name?.en || 'بدون اسم'}" بواسطة ${req.user.name}.`,
      type:         'info',
      resourceType: 'Technology',
      resourceId:   technology._id,
      recipient:    null,
    });

    res.status(200).json({ success: true, message: 'Technology updated.', data: technology });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Delete technology
 * @route  DELETE /api/admin/technologies/:id
 * @access Private (admin+)
 */
const deleteTechnology = async (req, res) => {
  try {
    const technology = await Technology.findByIdAndDelete(req.params.id);

    if (!technology) {
      return res.status(404).json({ success: false, message: 'Technology not found.' });
    }

    await ActivityLog.create({
      user:          req.user._id,
      action:        'DELETE',
      resourceType:  'Technology',
      resourceId:    technology._id,
      resourceTitle: technology.name?.en || technology.name,
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins notified of technology deletion
    await createSystemNotification({
      title:        'Technology Deleted',
      titleAr:      'تم حذف تقنية',
      message:      `Technology "${technology.name?.en || technology.name || 'Untitled'}" has been permanently deleted by ${req.user.name}.`,
      messageAr:    `تم حذف تقنية "${technology.name?.ar || technology.name?.en || 'بدون اسم'}" بشكل نهائي بواسطة ${req.user.name}.`,
      type:         'warning',
      resourceType: 'Technology',
      resourceId:   technology._id,
      recipient:    null,
    });

    res.status(200).json({ success: true, message: 'Technology deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = {
  getTechnologies,
  getAllTechnologiesAdmin,
  createTechnology,
  updateTechnology,
  deleteTechnology,
};