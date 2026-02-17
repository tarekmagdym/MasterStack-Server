const express = require('express');
const router = express.Router();

const {
  getTechnologies,
  getAllTechnologiesAdmin,
  createTechnology,
  updateTechnology,
  deleteTechnology,
} = require('../controllers/technology.controller');

const { authenticate } = require('../middleware/auth.middleware');
const { canWrite, canDelete } = require('../middleware/role.middleware');

// ── Public Routes ──────────────────────────────────────────
router.get('/', getTechnologies);

// ── Admin Routes ───────────────────────────────────────────
router.get('/admin', authenticate, getAllTechnologiesAdmin);
router.post('/admin', authenticate, canWrite, createTechnology);
router.put('/admin/:id', authenticate, canWrite, updateTechnology);
router.delete('/admin/:id', authenticate, canDelete, deleteTechnology);

module.exports = router;