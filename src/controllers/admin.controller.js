const User           = require('../models/User.model');
const Project        = require('../models/Project.model');
const Service        = require('../models/Service.model');
const Technology     = require('../models/Technology.model');
const ContactMessage = require('../models/ContactMessage.model');
const ActivityLog    = require('../models/ActivityLog.model');
const { createSystemNotification } = require('./Notification.controller');

// ─── Controllers ──────────────────────────────────────────────────────────────

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
        projects:       { total: totalProjects, published: publishedProjects, featured: featuredProjects },
        services:       { total: totalServices },
        technologies:   { total: totalTechnologies },
        team:           { total: totalMembers },
        messages:       { total: totalMessages, unread: unreadMessages },
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

    await ActivityLog.create({
      user:          req.user._id,
      action:        'CREATE',
      resourceType:  'User',
      resourceId:    user._id,
      resourceTitle: user.email,
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins notified of new user creation
    await createSystemNotification({
      title:        'New User Created',
      titleAr:      'تم إنشاء مستخدم جديد',
      message:      `User "${user.name}" (${user.email}) has been created with the role: ${role}.`,
      messageAr:    `تم إنشاء المستخدم "${user.name}" (${user.email}) بصلاحية: ${role}.`,
      type:         'success',
      resourceType: 'User',
      resourceId:   user._id,
      recipient:    null,
    });

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

    if (req.params.id === req.user._id.toString() && role) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
    }

    // Snapshot before update so we can detect what actually changed
    const before = await User.findById(req.params.id);
    if (!before) return res.status(404).json({ success: false, message: 'User not found.' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    );

    await ActivityLog.create({
      user:          req.user._id,
      action:        'UPDATE',
      resourceType:  'User',
      resourceId:    user._id,
      resourceTitle: user.email,
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — account deactivated
    if (before.isActive && isActive === false) {
      await createSystemNotification({
        title:        'Account Deactivated',
        titleAr:      'تم تعطيل حساب',
        message:      `User "${user.name}" (${user.email}) has been deactivated.`,
        messageAr:    `تم تعطيل حساب المستخدم "${user.name}" (${user.email}).`,
        type:         'warning',
        resourceType: 'User',
        resourceId:   user._id,
        recipient:    null,
      });
    }

    // ✅ Broadcast — account re-activated
    if (!before.isActive && isActive === true) {
      await createSystemNotification({
        title:        'Account Reactivated',
        titleAr:      'تم تفعيل حساب',
        message:      `User "${user.name}" (${user.email}) has been reactivated.`,
        messageAr:    `تم تفعيل حساب المستخدم "${user.name}" (${user.email}).`,
        type:         'success',
        resourceType: 'User',
        resourceId:   user._id,
        recipient:    null,
      });
    }

    // ✅ Broadcast — role changed
    if (role && before.role !== role) {
      await createSystemNotification({
        title:        'User Role Updated',
        titleAr:      'تم تحديث صلاحية مستخدم',
        message:      `"${user.name}" role changed from "${before.role}" to "${role}".`,
        messageAr:    `تم تغيير صلاحية "${user.name}" من "${before.role}" إلى "${role}".`,
        type:         'info',
        resourceType: 'User',
        resourceId:   user._id,
        recipient:    null,
      });
    }

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

    await ActivityLog.create({
      user:          req.user._id,
      action:        'DELETE',
      resourceType:  'User',
      resourceId:    user._id,
      resourceTitle: user.email,
      ipAddress:     req.ip,
    });

    // ✅ Broadcast — all admins should be aware a user was removed
    await createSystemNotification({
      title:        'User Removed',
      titleAr:      'تم حذف مستخدم',
      message:      `User "${user.name}" (${user.email}) has been permanently deleted from the system.`,
      messageAr:    `تم حذف المستخدم "${user.name}" (${user.email}) من النظام بشكل نهائي.`,
      type:         'warning',
      resourceType: 'User',
      resourceId:   user._id,
      recipient:    null, // broadcast to all admins
    });

    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Clear ALL activity logs
 * @route  DELETE /api/admin/activity-logs
 * @access Private (super_admin)
 */
const clearActivityLogs = async (req, res) => {
  try {
    const result = await ActivityLog.deleteMany({});

    // Log this action itself so there's a record it happened
    await ActivityLog.create({
      user:          req.user._id,
      action:        'DELETE',
      resourceType:  'User',
      resourceId:    req.user._id,
      resourceTitle: 'All activity logs cleared',
      ipAddress:     req.ip,
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} activity log(s) cleared successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get activity logs with filtering, search, and pagination
 * @route  GET /api/admin/activity-logs?page=1&limit=20&action=CREATE&resourceType=Project&search=
 * @access Private (super_admin)
 */
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, resourceType, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};

    if (action && action !== 'all') {
      filter.action = action.toUpperCase();
    }

    if (resourceType && resourceType !== 'all') {
      filter.resourceType = resourceType;
    }

    if (search && search.trim()) {
      filter.resourceTitle = { $regex: search.trim(), $options: 'i' };
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email role'),
      ActivityLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
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
 * @desc   Get full statistics for the Statistics page
 * @route  GET /api/admin/statistics
 * @access Private
 */
const getStatistics = async (req, res) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // ── Projects over time (last 12 months) ──────────────────────────────
    const projectsOverTime = await Project.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── Projects by category ─────────────────────────────────────────────
    const projectsByCategory = await Project.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Projects by status ───────────────────────────────────────────────
    const [publishedCount, draftCount, featuredCount] = await Promise.all([
      Project.countDocuments({ isPublished: true }),
      Project.countDocuments({ isPublished: false }),
      Project.countDocuments({ isFeatured: true }),
    ]);

    // ── Contact messages over time (last 12 months) ──────────────────────
    const messagesOverTime = await ContactMessage.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── Services breakdown ───────────────────────────────────────────────
    const [totalServices, publishedServices, featuredServices] = await Promise.all([
      Service.countDocuments(),
      Service.countDocuments({ isPublished: true }),
      Service.countDocuments({ isFeatured: true }),
    ]);

    // ── Activity logs by action (last 30 days) ───────────────────────────
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activityByAction = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Activity logs by resource type (last 30 days) ────────────────────
    const activityByResource = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$resourceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Activity over time (last 12 months) ──────────────────────────────
    const activityOverTime = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── Top active users (last 30 days) ──────────────────────────────────
    const topUsers = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          name: '$userInfo.name',
          email: '$userInfo.email',
          role: '$userInfo.role',
          count: 1,
        },
      },
    ]);

    // ── Summary counts ───────────────────────────────────────────────────
    const [totalProjects, totalMessages, totalUnread, totalUsers, totalTech] = await Promise.all([
      Project.countDocuments(),
      ContactMessage.countDocuments(),
      ContactMessage.countDocuments({ isRead: false }),
      // User model available via require('../models/User.model') — already in scope
      // We reference it via the getDashboardStats function's module scope
      require('../models/User.model').countDocuments(),
      require('../models/Technology.model').countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProjects,
          totalMessages,
          totalUnread,
          totalUsers,
          totalServices,
          totalTech,
        },
        projects: {
          overTime: projectsOverTime,
          byCategory: projectsByCategory,
          byStatus: {
            published: publishedCount,
            draft: draftCount,
            featured: featuredCount,
          },
        },
        messages: {
          overTime: messagesOverTime,
          totalRead: totalMessages - totalUnread,
          totalUnread,
        },
        services: {
          total: totalServices,
          published: publishedServices,
          featured: featuredServices,
          draft: totalServices - publishedServices,
        },
        activity: {
          byAction: activityByAction,
          byResource: activityByResource,
          overTime: activityOverTime,
          topUsers,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = { getDashboardStats, getUsers, createUser, updateUser, deleteUser, getActivityLogs, clearActivityLogs, getStatistics };