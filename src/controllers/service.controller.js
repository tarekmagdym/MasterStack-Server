// ============================================================
// service.controller.js
// ============================================================
const Service = require('../models/Service.model');
const ActivityLog = require('../models/ActivityLog.model');

const getServices = async (req, res) => {
  try {
    const services = await Service.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .select('-createdBy -updatedBy -__v');
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const getAllServicesAdmin = async (req, res) => {
  try {
    const services = await Service.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const createService = async (req, res) => {
  try {
    const service = await Service.create({ ...req.body, createdBy: req.user._id });
    await ActivityLog.create({ user: req.user._id, action: 'CREATE', resourceType: 'Service', resourceId: service._id, resourceTitle: service.title, ipAddress: req.ip });
    res.status(201).json({ success: true, message: 'Service created.', data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
    await ActivityLog.create({ user: req.user._id, action: 'UPDATE', resourceType: 'Service', resourceId: service._id, resourceTitle: service.title, ipAddress: req.ip });
    res.status(200).json({ success: true, message: 'Service updated.', data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
    await ActivityLog.create({ user: req.user._id, action: 'DELETE', resourceType: 'Service', resourceId: service._id, resourceTitle: service.title, ipAddress: req.ip });
    res.status(200).json({ success: true, message: 'Service deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = { getServices, getAllServicesAdmin, createService, updateService, deleteService };
