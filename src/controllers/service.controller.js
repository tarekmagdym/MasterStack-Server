const Service     = require('../models/Service.model');
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
  ['title', 'description', 'shortDescription'].forEach((field) => {
    if (doc[field] && typeof doc[field] === 'object' && !Array.isArray(doc[field])) {
      doc[field] = doc[field][lang] || doc[field]['en'] || '';
    }
  });

  if (lang === 'ar' && Array.isArray(doc.featuresAr) && doc.featuresAr.length > 0) {
    doc.features = doc.featuresAr;
  }
  delete doc.featuresAr;

  return doc;
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc   Get all published services (public)
 * @route  GET /api/services
 * @access Public
 */
const getServices = async (req, res) => {
  try {
    const lang     = getLang(req);
    const services = await Service.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .select('-createdBy -updatedBy -__v')
      .lean();

    res.status(200).json({
      success: true,
      lang,
      data: services.map(s => localizeDoc(s, lang)),
    });
  } catch (error) {
    console.error('getServices error:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get FEATURED published services (for home page section)
 * @route  GET /api/services/featured
 * @access Public
 */
const getFeaturedServices = async (req, res) => {
  try {
    const lang     = getLang(req);
    const services = await Service.find({ isPublished: true, isFeatured: true })
      .sort({ order: 1, createdAt: -1 })
      .select('-createdBy -updatedBy -__v')
      .lean();

    res.status(200).json({
      success: true,
      lang,
      data: services.map(s => localizeDoc(s, lang)),
    });
  } catch (error) {
    console.error('getFeaturedServices error:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — raw { en, ar } objects returned as-is (no localization)
// ─────────────────────────────────────────────────────────────────────────────

const getAllServicesAdmin = async (req, res) => {
  try {
    const services = await Service.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error('getAllServicesAdmin error:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const createService = async (req, res) => {
  try {
    const service = await Service.create({ ...req.body, createdBy: req.user._id });

    await ActivityLog.create({
      user:          req.user._id,
      action:        'CREATE',
      resourceType:  'Service',
      resourceId:    service._id,
      resourceTitle: service.title?.en || service.title,
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins notified of new service
    await createSystemNotification({
      title:        'New Service Added',
      titleAr:      'تمت إضافة خدمة جديدة',
      message:      `Service "${service.title?.en || service.title || 'Untitled'}" has been created by ${req.user.name}.`,
      messageAr:    `تم إنشاء خدمة "${service.title?.ar || service.title?.en || 'بدون عنوان'}" بواسطة ${req.user.name}.`,
      type:         'success',
      resourceType: 'Service',
      resourceId:   service._id,
      recipient:    null,
    });

    res.status(201).json({ success: true, message: 'Service created.', data: service });
  } catch (error) {
    console.error('createService error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    await ActivityLog.create({
      user:          req.user._id,
      action:        'UPDATE',
      resourceType:  'Service',
      resourceId:    service._id,
      resourceTitle: service.title?.en || service.title,
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins notified of service update
    await createSystemNotification({
      title:        'Service Updated',
      titleAr:      'تم تحديث خدمة',
      message:      `Service "${service.title?.en || service.title || 'Untitled'}" has been updated by ${req.user.name}.`,
      messageAr:    `تم تحديث خدمة "${service.title?.ar || service.title?.en || 'بدون عنوان'}" بواسطة ${req.user.name}.`,
      type:         'info',
      resourceType: 'Service',
      resourceId:   service._id,
      recipient:    null,
    });

    res.status(200).json({ success: true, message: 'Service updated.', data: service });
  } catch (error) {
    console.error('updateService error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });

    await ActivityLog.create({
      user:          req.user._id,
      action:        'DELETE',
      resourceType:  'Service',
      resourceId:    service._id,
      resourceTitle: service.title?.en || service.title,
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins notified of service deletion
    await createSystemNotification({
      title:        'Service Deleted',
      titleAr:      'تم حذف خدمة',
      message:      `Service "${service.title?.en || service.title || 'Untitled'}" has been permanently deleted by ${req.user.name}.`,
      messageAr:    `تم حذف خدمة "${service.title?.ar || service.title?.en || 'بدون عنوان'}" بشكل نهائي بواسطة ${req.user.name}.`,
      type:         'warning',
      resourceType: 'Service',
      resourceId:   service._id,
      recipient:    null,
    });

    res.status(200).json({ success: true, message: 'Service deleted.' });
  } catch (error) {
    console.error('deleteService error:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = {
  getServices,
  getFeaturedServices,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
};