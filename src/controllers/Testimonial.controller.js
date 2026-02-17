const Testimonial = require("../models/Testimonial.model");

// @desc    Get all active testimonials (public)
// @route   GET /api/testimonials
// @access  Public
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({
      order: 1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all testimonials (admin - includes inactive)
// @route   GET /api/testimonials/all
// @access  Private (Admin)
const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single testimonial
// @route   GET /api/testimonials/:id
// @access  Private (Admin)
const getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create testimonial
// @route   POST /api/testimonials
// @access  Private (Admin)
const createTestimonial = async (req, res) => {
  try {
    const { name, position, company, content, rating, avatar, avatarColor, isActive, order } =
      req.body;

    const testimonial = await Testimonial.create({
      name,
      position,
      company,
      content,
      rating,
      avatar,
      avatarColor,
      isActive,
      order,
    });

    res.status(201).json({
      success: true,
      message: "Testimonial created successfully",
      data: testimonial,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Private (Admin)
const updateTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({
      success: true,
      message: "Testimonial updated successfully",
      data: testimonial,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private (Admin)
const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res
        .status(404)
        .json({ success: false, message: "Testimonial not found" });
    }

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTestimonials,
  getAllTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};