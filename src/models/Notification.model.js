const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    titleAr: {
      type: String,
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    messageAr: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      required: true,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    // What triggered this notification
    resourceType: {
      type: String,
      enum: ['Project', 'Service', 'Technology', 'TeamMember', 'ContactMessage', 'User', 'Auth', null],
      default: null,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // null = broadcast to all admins, otherwise a specific user
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Track which users have read this notification
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = system-generated
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);