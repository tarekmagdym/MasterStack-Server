const express = require('express');
const router = express.Router();
const { getProjects, getProjectBySlug } = require('../controllers/project.controller');

// Public routes
router.get('/', getProjects);
router.get('/:slug', getProjectBySlug);

module.exports = router;
