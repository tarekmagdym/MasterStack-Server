const Notification  = require('../models/Notification.model');
const ActivityLog   = require('../models/ActivityLog.model');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const visibilityFilter = (userId) => ({
  $or: [{ recipient: null }, { recipient: userId }],
});

const hasRead = (notification, userId) =>
  notification.readBy.some((r) => r.user.toString() === userId.toString());

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc   Get all notifications for the authenticated user
 * @route  GET /api/admin/notifications
 * @access Private
 * @query  page, limit, unreadOnly (true|false)
 */
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const userId = req.user._id;

    const filter = visibilityFilter(userId);

    if (unreadOnly === 'true') {
      filter['readBy.user'] = { $ne: userId };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name'),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        ...visibilityFilter(userId),
        'readBy.user': { $ne: userId },
      }),
    ]);

    const data = notifications.map((n) => ({
      ...n.toObject(),
      isRead: hasRead(n, userId),
    }));

    res.status(200).json({
      success: true,
      data,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get single notification (auto-marks as read)
 * @route  GET /api/admin/notifications/:id
 * @access Private
 */
const getNotification = async (req, res) => {
  try {
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: req.params.id,
      ...visibilityFilter(userId),
    }).populate('createdBy', 'name email');

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (!hasRead(notification, userId)) {
      notification.readBy.push({ user: userId, readAt: new Date() });
      await notification.save();
    }

    res.status(200).json({
      success: true,
      data: { ...notification.toObject(), isRead: true },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Mark a notification as read
 * @route  PATCH /api/admin/notifications/:id/read
 * @access Private
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: req.params.id,
      ...visibilityFilter(userId),
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (hasRead(notification, userId)) {
      return res.status(200).json({ success: true, message: 'Notification already marked as read.' });
    }

    notification.readBy.push({ user: userId, readAt: new Date() });
    await notification.save();

    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Mark ALL notifications as read for the authenticated user
 * @route  PATCH /api/admin/notifications/read-all
 * @access Private
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();

    const unread = await Notification.find({
      ...visibilityFilter(userId),
      'readBy.user': { $ne: userId },
    }).select('_id');

    if (!unread.length) {
      return res.status(200).json({ success: true, message: 'No unread notifications.' });
    }

    await Notification.updateMany(
      { _id: { $in: unread.map((n) => n._id) } },
      { $push: { readBy: { user: userId, readAt: now } } }
    );

    res.status(200).json({
      success: true,
      message: `${unread.length} notification(s) marked as read.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Create a notification (manual broadcast or targeted)
 * @route  POST /api/admin/notifications
 * @access Private (super_admin / admin)
 */
const createNotification = async (req, res) => {
  try {
    const { title, titleAr, message, messageAr, type, resourceType, resourceId, recipient } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const notification = await Notification.create({
      title,
      titleAr:      titleAr      || '',
      message,
      messageAr:    messageAr    || '',
      type:         type         || 'info',
      resourceType: resourceType || null,
      resourceId:   resourceId   || null,
      recipient:    recipient    || null,
      createdBy:    req.user._id,
    });

    await ActivityLog.create({
      user:          req.user._id,
      action:        'CREATE',
      resourceType:  'User',
      resourceId:    notification._id,
      resourceTitle: title,
      ipAddress:     req.ip,
    });

    res.status(201).json({ success: true, message: 'Notification created.', data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Delete a notification
 * @route  DELETE /api/admin/notifications/:id
 * @access Private (super_admin)
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await ActivityLog.create({
      user:          req.user._id,
      action:        'DELETE',
      resourceType:  'User',
      resourceId:    notification._id,
      resourceTitle: notification.title,
      ipAddress:     req.ip,
    });

    res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─── System helper ────────────────────────────────────────────────────────────

const createSystemNotification = async ({
  title,
  titleAr      = '',
  message,
  messageAr    = '',
  type         = 'info',
  resourceType = null,
  resourceId   = null,
  recipient    = null,
}) => {
  try {
    await Notification.create({
      title,
      titleAr,
      message,
      messageAr,
      type,
      resourceType,
      resourceId,
      recipient,
      createdBy: null,
    });
  } catch (err) {
    console.error('[Notification] Failed to create system notification:', err.message);
  }
};

module.exports = {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  createSystemNotification,
};