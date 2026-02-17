const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'MARK_READ'],
    },
    resourceType: {
      type: String,
      required: true,
      enum: ['Project', 'Service', 'Technology', 'TeamMember', 'ContactMessage', 'User', 'Auth'],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    resourceTitle: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ resourceType: 1, action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
