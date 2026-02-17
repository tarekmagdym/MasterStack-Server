const ContactMessage = require('../models/ContactMessage.model');
const ActivityLog = require('../models/ActivityLog.model');

/**
 * @desc   Submit contact form (public)
 * @route  POST /api/contact
 * @access Public
 */
const submitContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const contact = await ContactMessage.create({
      name, email, phone, subject, message,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been sent. We will get back to you soon.',
      data: { _id: contact._id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get all messages (admin)
 * @route  GET /api/admin/messages
 * @access Private
 */
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const filter = {};
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total, unreadCount] = await Promise.all([
      ContactMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('readBy', 'name'),
      ContactMessage.countDocuments(filter),
      ContactMessage.countDocuments({ isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: messages,
      unreadCount,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get single message
 * @route  GET /api/admin/messages/:id
 * @access Private
 */
const getMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id).populate('readBy', 'name email');
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    // Auto-mark as read when viewed
    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      message.readBy = req.user._id;
      await message.save();
      await ActivityLog.create({ user: req.user._id, action: 'MARK_READ', resourceType: 'ContactMessage', resourceId: message._id, resourceTitle: message.subject || message.email, ipAddress: req.ip });
    }

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Toggle read/unread
 * @route  PATCH /api/admin/messages/:id/read
 * @access Private
 */
const toggleReadStatus = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    message.isRead = !message.isRead;
    message.readAt = message.isRead ? new Date() : null;
    message.readBy = message.isRead ? req.user._id : null;
    await message.save();

    res.status(200).json({ success: true, message: `Message marked as ${message.isRead ? 'read' : 'unread'}.`, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Delete message
 * @route  DELETE /api/admin/messages/:id
 * @access Private (admin+)
 */
const deleteMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });
    await ActivityLog.create({ user: req.user._id, action: 'DELETE', resourceType: 'ContactMessage', resourceId: message._id, resourceTitle: message.subject || message.email, ipAddress: req.ip });
    res.status(200).json({ success: true, message: 'Message deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = { submitContact, getMessages, getMessage, toggleReadStatus, deleteMessage };
