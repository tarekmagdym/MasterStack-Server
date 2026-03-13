const express = require('express');
const router  = express.Router();

const {
  getServices,
  getFeaturedServices,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
} = require('../controllers/service.controller');

const { authenticate }        = require('../middleware/auth.middleware');
const { canWrite, canDelete } = require('../middleware/role.middleware');

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/',         getServices);
router.get('/featured', getFeaturedServices);   // ← home-page section

// ── Admin ────────────────────────────────────────────────────────────────────
router.get('/admin',        authenticate,            getAllServicesAdmin);
router.post('/admin',       authenticate, canWrite,  createService);
router.put('/admin/:id',    authenticate, canWrite,  updateService);
router.delete('/admin/:id', authenticate, canDelete, deleteService);

module.exports = router;