const express = require('express');
const router = express.Router();

const { getServices } = require('../controllers/service.controller');
const { getTechnologies } = require('../controllers/technology.controller');
const { getTeamMembers } = require('../controllers/teamMember.controller');
const { submitContact } = require('../controllers/contact.controller');
const { getTestimonials } = require('../controllers/Testimonial.controller');


// Public API routes
router.get('/services', getServices);
router.get('/technologies', getTechnologies);
router.get('/team', getTeamMembers);
router.post('/contact', submitContact);
router.get('/testimonials', getTestimonials); 

// Projects public routes
router.use('/projects', require('./project.routes'));

// Auth routes
router.use('/auth', require('./auth.routes'));

// Admin routes
router.use('/admin', require('./admin.routes'));
router.use('/testimonials', require('./testimonial.routes')); 


module.exports = router;
