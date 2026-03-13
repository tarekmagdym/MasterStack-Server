const ContactMessage = require('../models/ContactMessage.model');
const ActivityLog    = require('../models/ActivityLog.model');
const nodemailer     = require('nodemailer');
const { createSystemNotification } = require('./Notification.controller');

// ─── Controllers ──────────────────────────────────────────────────────────────

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

    // ✅ Broadcast to all admins — new message waiting
    await createSystemNotification({
      title:        'New Contact Message',
      titleAr:      'رسالة تواصل جديدة',
      message:      `${name} sent a message: "${subject || 'No subject'}"`,
      messageAr:    `أرسل ${name} رسالة: "${subject || 'بدون موضوع'}"`,
      type:         'info',
      resourceType: 'ContactMessage',
      resourceId:   contact._id,
      recipient:    null, // broadcast to all admins
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
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get single message (auto-marks as read)
 * @route  GET /api/admin/messages/:id
 * @access Private
 */
const getMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id).populate('readBy', 'name email');
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      message.readBy = req.user._id;
      await message.save();

      await ActivityLog.create({
        user:          req.user._id,
        action:        'MARK_READ',
        resourceType:  'ContactMessage',
        resourceId:    message._id,
        resourceTitle: message.subject || message.email,
        ipAddress:     req.ip,
      });
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

    res.status(200).json({
      success: true,
      message: `Message marked as ${message.isRead ? 'read' : 'unread'}.`,
      data: message,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Reply to a contact message by email
 * @route  POST /api/admin/messages/:id/reply
 * @access Private
 */
const replyToMessage = async (req, res) => {
  try {
    const { replyText } = req.body;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required.' });
    }

    const message = await ContactMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found.' });

    await sendReplyEmail(message.email, message.name, message.subject, replyText.trim());

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      message.readBy = req.user._id;
      await message.save();
    }

    await ActivityLog.create({
      user:          req.user._id,
      action:        'UPDATE',
      resourceType:  'ContactMessage',
      resourceId:    message._id,
      resourceTitle: `Reply to ${message.email}`,
      ipAddress:     req.ip,
    });

    res.status(200).json({ success: true, message: `Reply sent to ${message.email} successfully.` });
  } catch (error) {
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        success: false,
        message: 'Email authentication failed. Check EMAIL_USER and EMAIL_PASS in your .env file.',
      });
    }
    res.status(500).json({ success: false, message: 'Failed to send reply.', error: error.message });
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

    await ActivityLog.create({
      user:          req.user._id,
      action:        'DELETE',
      resourceType:  'ContactMessage',
      resourceId:    message._id,
      resourceTitle: message.subject || message.email,
      ipAddress:     req.ip,
    });

    res.status(200).json({ success: true, message: 'Message deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─── Email ────────────────────────────────────────────────────────────────────

/**
 * Uses Gmail SMTP — add these to your .env:
 *   EMAIL_USER=masterstackk.official@gmail.com
 *   EMAIL_PASS=your_gmail_app_password   ← NOT your normal password, use App Password
 *
 * To get an App Password:
 *   Google Account → Security → 2-Step Verification → App passwords
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a reply email to a contact message sender
 * @param {string} toEmail    - Recipient email (from the contact message)
 * @param {string} toName     - Recipient name
 * @param {string} subject    - Original subject (will be prefixed with "Re: ")
 * @param {string} replyText  - The reply body written by the admin
 */
const sendReplyEmail = async (toEmail, toName, subject, replyText) => {
  const mailOptions = {
    from: `"MasterStack" <${process.env.EMAIL_USER}>`,
    to:   `"${toName}" <${toEmail}>`,
    subject: `Re: ${subject || 'Your message to MasterStack'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { margin: 0; padding: 0; background: #f4f6f9; font-family: 'Segoe UI', Arial, sans-serif; }
            .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #0e3581 0%, #26cabc 100%); padding: 32px 40px; text-align: center; }
            .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
            .header p  { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
            .body { padding: 40px; }
            .greeting { font-size: 18px; font-weight: 600; color: #1a1a2e; margin: 0 0 16px; }
            .message  { font-size: 15px; line-height: 1.7; color: #4a4a6a; white-space: pre-wrap; background: #f8f9fc; border-left: 4px solid #26cabc; border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 0 0 24px; }
            .footer { text-align: center; padding: 24px 40px; background: #f8f9fc; border-top: 1px solid #eef0f5; }
            .footer p { margin: 0; font-size: 13px; color: #9a9ab0; }
            .footer a { color: #26cabc; text-decoration: none; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>MasterStack</h1>
              <p>We got back to you!</p>
            </div>
            <div class="body">
              <p class="greeting">Hello ${toName},</p>
              <div class="message">${replyText}</div>
              <p style="font-size:14px;color:#9a9ab0;margin:0;">
                This is a reply to your message: <em>${subject || '(no subject)'}</em>
              </p>
            </div>
            <div class="footer">
              <p>
                MasterStack · Cairo, Egypt<br/>
                <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hello ${toName},\n\n${replyText}\n\n---\nMasterStack Team\n${process.env.EMAIL_USER}`,
  };

  await transporter.sendMail(mailOptions);
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  submitContact,
  getMessages,
  getMessage,
  toggleReadStatus,
  replyToMessage,
  deleteMessage,
  sendReplyEmail,
};