const express = require("express");
const router = express.Router();
const {
  getTestimonials,
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require("../controllers/Testimonial.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, canDelete, canWrite } = require("../middleware/role.middleware");

// Public
router.get("/", getTestimonials);

// Admin only
router.get("/all", authenticate, authorize("super_admin", "admin"), getAllTestimonials);
router.get("/:id", authenticate, authorize("super_admin", "admin"), getTestimonialById);
router.post("/", authenticate, canWrite, createTestimonial);
router.put("/:id", authenticate, canWrite, updateTestimonial);
router.delete("/:id", authenticate, canDelete, deleteTestimonial);

module.exports = router;