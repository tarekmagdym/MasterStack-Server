const express = require('express');
const router  = express.Router();

const {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
} = require('../controllers/Notification.controller');

const { authenticate } = require('../middleware/auth.middleware');
const { canDelete }     = require('../middleware/role.middleware');

// All notification routes require authentication
router.use(authenticate);

// ── Read ────────────────────────────────────────────────────
router.get('/',              getNotifications);   // ?page=1&limit=20&unreadOnly=true
router.get('/:id',           getNotification);    // auto-marks as read

// ── Mark as read ────────────────────────────────────────────
router.patch('/read-all',    markAllAsRead);       // must be before /:id
router.patch('/:id/read',    markAsRead);

// ── Create / Delete ─────────────────────────────────────────
router.post('/',             createNotification);
router.delete('/:id',        canDelete, deleteNotification);

module.exports = router;