const express = require('express');
const router  = express.Router();

const {
  submitContact,
  getMessages,
  getMessage,
  toggleReadStatus,
  replyToMessage,
  deleteMessage,
} = require('../controllers/contact.controller');

const { authenticate } = require('../middleware/auth.middleware');
const { canDelete }     = require('../middleware/role.middleware');

// ── Public ─────────────────────────────────────────────────
router.post('/', submitContact);

// ── Admin ───────────────────────────────────────────────────
router.get('/admin',              authenticate, getMessages);
router.get('/admin/:id',          authenticate, getMessage);
router.patch('/admin/:id/read',   authenticate, toggleReadStatus);
router.post('/admin/:id/reply',   authenticate, replyToMessage); 
router.delete('/admin/:id',       authenticate, canDelete, deleteMessage);

module.exports = router;