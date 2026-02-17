const Technology = require('../models/Technology.model');
const ActivityLog = require('../models/ActivityLog.model');

const getTechnologies = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;

    const technologies = await Technology.find(filter)
      .sort({ category: 1, order: 1 })
      .select('-createdBy -updatedBy -__v');

    // Group by category for convenience
    const grouped = technologies.reduce((acc, tech) => {
      if (!acc[tech.category]) acc[tech.category] = [];
      acc[tech.category].push(tech);
      return acc;
    }, {});

    res.status(200).json({ success: true, data: technologies, grouped });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const getAllTechnologiesAdmin = async (req, res) => {
  try {
    const technologies = await Technology.find()
      .sort({ category: 1, order: 1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    res.status(200).json({ success: true, data: technologies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const createTechnology = async (req, res) => {
  try {
    const technology = await Technology.create({ ...req.body, createdBy: req.user._id });
    await ActivityLog.create({ user: req.user._id, action: 'CREATE', resourceType: 'Technology', resourceId: technology._id, resourceTitle: technology.name, ipAddress: req.ip });
    res.status(201).json({ success: true, message: 'Technology created.', data: technology });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const updateTechnology = async (req, res) => {
  try {
    const technology = await Technology.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (!technology) return res.status(404).json({ success: false, message: 'Technology not found.' });
    await ActivityLog.create({ user: req.user._id, action: 'UPDATE', resourceType: 'Technology', resourceId: technology._id, resourceTitle: technology.name, ipAddress: req.ip });
    res.status(200).json({ success: true, message: 'Technology updated.', data: technology });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const deleteTechnology = async (req, res) => {
  try {
    const technology = await Technology.findByIdAndDelete(req.params.id);
    if (!technology) return res.status(404).json({ success: false, message: 'Technology not found.' });
    await ActivityLog.create({ user: req.user._id, action: 'DELETE', resourceType: 'Technology', resourceId: technology._id, resourceTitle: technology.name, ipAddress: req.ip });
    res.status(200).json({ success: true, message: 'Technology deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = { getTechnologies, getAllTechnologiesAdmin, createTechnology, updateTechnology, deleteTechnology };
