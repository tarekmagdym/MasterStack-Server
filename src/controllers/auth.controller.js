const jwt          = require('jsonwebtoken');
const User         = require('../models/User.model');
const ActivityLog  = require('../models/ActivityLog.model');
const { createSystemNotification } = require('./Notification.controller');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc   Login admin/employee
 * @route  POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Contact the administrator.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    await ActivityLog.create({
      user:          user._id,
      action:        'LOGIN',
      resourceType:  'Auth',
      resourceTitle: user.email,
      ipAddress:     req.ip,
    });

    await createSystemNotification({
      title:        'New Login Detected',
      titleAr:      'تم تسجيل دخول جديد',
      message:      `A new login to your account was detected from IP: ${req.ip}.`,
      messageAr:    `تم تسجيل دخول جديد لحسابك من عنوان IP: ${req.ip}.`,
      type:         'info',
      resourceType: 'Auth',
      resourceId:   user._id,
      recipient:    user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          _id:       user._id,
          name:      user.name,
          email:     user.email,
          role:      user.role,
          avatar:    user.avatar ?? null,
          lastLogin: user.lastLogin,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Get currently authenticated user
 * @route  GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Change own password
 * @route  PUT /api/auth/change-password
 * @access Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters.',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    await createSystemNotification({
      title:        'Password Changed',
      titleAr:      'تم تغيير كلمة المرور',
      message:      "Your password was changed successfully. If this wasn't you, contact an administrator immediately.",
      messageAr:    'تم تغيير كلمة مرورك بنجاح. إذا لم تقم بذلك، تواصل مع المسؤول فوراً.',
      type:         'warning',
      resourceType: 'Auth',
      resourceId:   req.user._id,
      recipient:    req.user._id,
    });

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Upload / update profile avatar
 * @route  POST /api/auth/avatar
 * @access Private
 */
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully.',
      data: { avatar: user.avatar },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = { login, getMe, changePassword, updateAvatar };