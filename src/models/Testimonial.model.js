const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Testimonial content is required"],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
      default: 5,
    },
    avatar: {
      type: String, // initials or image URL
      trim: true,
    },
    avatarColor: {
      type: String,
      default: "#4F46E5",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);