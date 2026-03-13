const mongoose   = require('mongoose');
const Project    = require('../models/Project.model');
const ActivityLog = require('../models/ActivityLog.model');
const { createSystemNotification } = require('./Notification.controller');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const remapForPublic = (doc) => ({
  ...doc,
  image:   doc.thumbnail,
  liveUrl: doc.projectUrl || '',
  year:    doc.completionDate
    ? new Date(doc.completionDate).getFullYear().toString()
    : '',
});

const makeSlug = (titleEn) =>
  titleEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const sanitizeBody = (body, isNew = false) => {
  const data = { ...body };

  if (!data.completionDate || data.completionDate === '') {
    delete data.completionDate;
  }

  if (
    data.shortDescription &&
    !data.shortDescription.en?.trim() &&
    !data.shortDescription.ar?.trim()
  ) {
    delete data.shortDescription;
  }

  if (data.category) {
    data.category = data.category.toLowerCase().trim();
  }

  if (isNew && data.title?.en) {
    data.slug = makeSlug(data.title.en);
  }

  return data;
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC endpoints
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc   Get all published projects
 * @route  GET /api/projects
 * @access Public
 */
const getProjects = async (req, res) => {
  try {
    const { category, featured, page = 1, limit = 20 } = req.query;

    const filter = { isPublished: true };
    if (category) filter.category = category.toLowerCase();
    if (featured === 'true') filter.isFeatured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('title description shortDescription tags slug thumbnail images technologies category clientName projectUrl completionDate isFeatured isPublished order createdAt')
        .lean(),
      Project.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: projects.map(remapForPublic),
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get single published project by slug OR _id
 * @route  GET /api/projects/:slug
 * @access Public
 */
const getProjectBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);

    const filter = isObjectId
      ? { _id: slug,  isPublished: true }
      : { slug: slug, isPublished: true };

    const project = await Project.findOne(filter)
      .select('-createdBy -updatedBy -__v')
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.status(200).json({ success: true, data: remapForPublic(project) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN endpoints
// ─────────────────────────────────────────────────────────────────────────────

const getAllProjectsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 12, search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.ar': { $regex: search, $options: 'i' } },
        { clientName:  { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email'),
      Project.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const data    = sanitizeBody(req.body, true);
    const project = new Project({ ...data, createdBy: req.user._id });
    await project.save();

    await ActivityLog.create({
      user:          req.user._id,
      action:        'CREATE',
      resourceType:  'Project',
      resourceId:    project._id,
      resourceTitle: project.title?.en || '',
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins notified of new project
    await createSystemNotification({
      title:        'New Project Added',
      titleAr:      'تمت إضافة مشروع جديد',
      message:      `Project "${project.title?.en || 'Untitled'}" has been created by ${req.user.name}.`,
      messageAr:    `تم إنشاء مشروع "${project.title?.ar || project.title?.en || 'بدون عنوان'}" بواسطة ${req.user.name}.`,
      type:         'success',
      resourceType: 'Project',
      resourceId:   project._id,
      recipient:    null,
    });

    res.status(201).json({ success: true, message: 'Project created.', data: project });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ success: false, message: 'A project with this title already exists.' });
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(' | ') });
    }
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const data = sanitizeBody(req.body);
    if (data.title?.en) data.slug = makeSlug(data.title.en);

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...data, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!project)
      return res.status(404).json({ success: false, message: 'Project not found.' });

    await ActivityLog.create({
      user:          req.user._id,
      action:        'UPDATE',
      resourceType:  'Project',
      resourceId:    project._id,
      resourceTitle: project.title?.en || '',
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins notified of project update
    await createSystemNotification({
      title:        'Project Updated',
      titleAr:      'تم تحديث مشروع',
      message:      `Project "${project.title?.en || 'Untitled'}" has been updated by ${req.user.name}.`,
      messageAr:    `تم تحديث مشروع "${project.title?.ar || project.title?.en || 'بدون عنوان'}" بواسطة ${req.user.name}.`,
      type:         'info',
      resourceType: 'Project',
      resourceId:   project._id,
      recipient:    null,
    });

    res.status(200).json({ success: true, message: 'Project updated.', data: project });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ success: false, message: 'A project with this title already exists.' });
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(' | ') });
    }
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project)
      return res.status(404).json({ success: false, message: 'Project not found.' });

    await ActivityLog.create({
      user:          req.user._id,
      action:        'DELETE',
      resourceType:  'Project',
      resourceId:    project._id,
      resourceTitle: project.title?.en || '',
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins notified of project deletion
    await createSystemNotification({
      title:        'Project Deleted',
      titleAr:      'تم حذف مشروع',
      message:      `Project "${project.title?.en || 'Untitled'}" has been permanently deleted by ${req.user.name}.`,
      messageAr:    `تم حذف مشروع "${project.title?.ar || project.title?.en || 'بدون عنوان'}" بشكل نهائي بواسطة ${req.user.name}.`,
      type:         'warning',
      resourceType: 'Project',
      resourceId:   project._id,
      recipient:    null,
    });

    res.status(200).json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = {
  getProjects,
  getProjectBySlug,
  getAllProjectsAdmin,
  createProject,
  updateProject,
  deleteProject,
};