const express = require('express');
const router = express.Router();

const {
  getTeamMembers,
  getAllTeamMembersAdmin,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require('../controllers/teamMember.controller');

const { authenticate } = require('../middleware/auth.middleware');
const { canWrite, canDelete } = require('../middleware/role.middleware');

// ── Public Routes ──────────────────────────────────────────
router.get('/', getTeamMembers);

// ── Admin Routes ───────────────────────────────────────────
router.get('/admin', authenticate, getAllTeamMembersAdmin);
router.post('/admin', authenticate, canWrite, createTeamMember);
router.put('/admin/:id', authenticate, canWrite, updateTeamMember);
router.delete('/admin/:id', authenticate, canDelete, deleteTeamMember);

module.exports = router;