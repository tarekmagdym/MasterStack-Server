const User = require('../models/User.model');
const Project = require('../models/Project.model');
const Service = require('../models/Service.model');
const Technology = require('../models/Technology.model');
const TeamMember = require('../models/TeamMember.model');
const ContactMessage = require('../models/ContactMessage.model');
const ActivityLog = require('../models/ActivityLog.model');

/**
 * @desc   Get dashboard statistics
 * @route  GET /api/admin/stats
 * @access Private
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalProjects, publishedProjects, featuredProjects,
      totalServices, totalTechnologies, totalMembers,
      totalMessages, unreadMessages,
      recentLogs,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ isPublished: true }),
      Project.countDocuments({ isFeatured: true }),
      Service.countDocuments({ isPublished: true }),
      Technology.countDocuments({ isPublished: true }),
      TeamMember.countDocuments({ isPublished: true }),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ isRead: false }),
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'name role'),
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects: { total: totalProjects, published: publishedProjects, featured: featuredProjects },
        services: { total: totalServices },
        technologies: { total: totalTechnologies },
        team: { total: totalMembers },
        messages: { total: totalMessages, unread: unreadMessages },
        recentActivity: recentLogs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get all users (super admin only)
 * @route  GET /api/admin/users
 * @access Private (super_admin)
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).populate('createdBy', 'name');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Create new user (super admin only)
 * @route  POST /api/admin/users
 * @access Private (super_admin)
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be admin or employee.' });
    }

    const user = await User.create({ name, email, password, role, createdBy: req.user._id });

    await ActivityLog.create({ user: req.user._id, action: 'CREATE', resourceType: 'User', resourceId: user._id, resourceTitle: user.email, ipAddress: req.ip });

    res.status(201).json({ success: true, message: 'User created.', data: user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use.' });
    }
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Update user
 * @route  PUT /api/admin/users/:id
 * @access Private (super_admin)
 */
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    // Prevent modifying own role
    if (req.params.id === req.user._id.toString() && role) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await ActivityLog.create({ user: req.user._id, action: 'UPDATE', resourceType: 'User', resourceId: user._id, resourceTitle: user.email, ipAddress: req.ip });

    res.status(200).json({ success: true, message: 'User updated.', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Delete user
 * @route  DELETE /api/admin/users/:id
 * @access Private (super_admin)
 */
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await ActivityLog.create({ user: req.user._id, action: 'DELETE', resourceType: 'User', resourceId: user._id, resourceTitle: user.email, ipAddress: req.ip });

    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get activity logs
 * @route  GET /api/admin/activity-logs
 * @access Private (super_admin)
 */
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email role'),
      ActivityLog.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = { getDashboardStats, getUsers, createUser, updateUser, deleteUser, getActivityLogs };
