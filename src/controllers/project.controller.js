const Project = require('../models/Project.model');
const ActivityLog = require('../models/ActivityLog.model');

/**
 * @desc   Get all published projects (public)
 * @route  GET /api/projects
 * @access Public
 */
const getProjects = async (req, res) => {
  try {
    const { category, featured, page = 1, limit = 20 } = req.query;

    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-createdBy -updatedBy -__v'),
      Project.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: projects,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get single project by slug (public)
 * @route  GET /api/projects/:slug
 * @access Public
 */
const getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, isPublished: true }).select('-createdBy -updatedBy -__v');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get all projects for dashboard (admin)
 * @route  GET /api/admin/projects
 * @access Private
 */
const getAllProjectsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.title = { $regex: search, $options: 'i' };

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
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Create new project
 * @route  POST /api/admin/projects
 * @access Private (admin+)
 */
const createProject = async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, createdBy: req.user._id });

    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE',
      resourceType: 'Project',
      resourceId: project._id,
      resourceTitle: project.title,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Project created.', data: project });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A project with this title already exists.' });
    }
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Update project
 * @route  PUT /api/admin/projects/:id
 * @access Private (admin+)
 */
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'UPDATE',
      resourceType: 'Project',
      resourceId: project._id,
      resourceTitle: project.title,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Project updated.', data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Delete project
 * @route  DELETE /api/admin/projects/:id
 * @access Private (admin+)
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE',
      resourceType: 'Project',
      resourceId: project._id,
      resourceTitle: project.title,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = { getProjects, getProjectBySlug, getAllProjectsAdmin, createProject, updateProject, deleteProject };
