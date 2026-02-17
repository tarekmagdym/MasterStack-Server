const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');
const { authorize, canWrite, canDelete, isSuperAdmin } = require('../middleware/role.middleware');

// Controllers
const { getDashboardStats, getUsers, createUser, updateUser, deleteUser, getActivityLogs } = require('../controllers/admin.controller');
const { getAllProjectsAdmin, createProject, updateProject, deleteProject } = require('../controllers/project.controller');
const { getAllServicesAdmin, createService, updateService, deleteService } = require('../controllers/service.controller');
const { getAllTechnologiesAdmin, createTechnology, updateTechnology, deleteTechnology } = require('../controllers/technology.controller');
const { getAllTeamMembersAdmin, createTeamMember, updateTeamMember, deleteTeamMember } = require('../controllers/teamMember.controller');
const { getMessages, getMessage, toggleReadStatus, deleteMessage } = require('../controllers/contact.controller');

// All admin routes require authentication
router.use(authenticate);

// ── Dashboard ─────────────────────────────────────────────
router.get('/stats', getDashboardStats);

// ── Projects ──────────────────────────────────────────────
router.get('/projects', getAllProjectsAdmin);
router.post('/projects', canWrite, createProject);
router.put('/projects/:id', canWrite, updateProject);
router.delete('/projects/:id', canDelete, deleteProject);

// ── Services ──────────────────────────────────────────────
router.get('/services', getAllServicesAdmin);
router.post('/services', canWrite, createService);
router.put('/services/:id', canWrite, updateService);
router.delete('/services/:id', canDelete, deleteService);

// ── Technologies ──────────────────────────────────────────
router.get('/technologies', getAllTechnologiesAdmin);
router.post('/technologies', canWrite, createTechnology);
router.put('/technologies/:id', canWrite, updateTechnology);
router.delete('/technologies/:id', canDelete, deleteTechnology);

// ── Team Members ──────────────────────────────────────────
router.get('/team', getAllTeamMembersAdmin);
router.post('/team', canWrite, createTeamMember);
router.put('/team/:id', canWrite, updateTeamMember);
router.delete('/team/:id', canDelete, deleteTeamMember);

// ── Contact Messages ──────────────────────────────────────
router.get('/messages', getMessages);
router.get('/messages/:id', getMessage);
router.patch('/messages/:id/read', toggleReadStatus);
router.delete('/messages/:id', canDelete, deleteMessage);

// ── User Management (super_admin only) ────────────────────
router.get('/users', isSuperAdmin, getUsers);
router.post('/users', isSuperAdmin, createUser);
router.put('/users/:id', isSuperAdmin, updateUser);
router.delete('/users/:id', isSuperAdmin, deleteUser);

// ── Activity Logs (super_admin only) ──────────────────────
router.get('/activity-logs', isSuperAdmin, getActivityLogs);

module.exports = router;
