const TeamMember = require('../models/TeamMember.model');
const ActivityLog = require('../models/ActivityLog.model');

const getTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .select('-createdBy -updatedBy -__v');
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const getAllTeamMembersAdmin = async (req, res) => {
  try {
    const members = await TeamMember.find()
      .sort({ order: 1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const createTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.create({ ...req.body, createdBy: req.user._id });
    await ActivityLog.create({ user: req.user._id, action: 'CREATE', resourceType: 'TeamMember', resourceId: member._id, resourceTitle: member.name, ipAddress: req.ip });
    res.status(201).json({ success: true, message: 'Team member created.', data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const updateTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found.' });
    await ActivityLog.create({ user: req.user._id, action: 'UPDATE', resourceType: 'TeamMember', resourceId: member._id, resourceTitle: member.name, ipAddress: req.ip });
    res.status(200).json({ success: true, message: 'Team member updated.', data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

const deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Team member not found.' });
    await ActivityLog.create({ user: req.user._id, action: 'DELETE', resourceType: 'TeamMember', resourceId: member._id, resourceTitle: member.name, ipAddress: req.ip });
    res.status(200).json({ success: true, message: 'Team member deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = { getTeamMembers, getAllTeamMembersAdmin, createTeamMember, updateTeamMember, deleteTeamMember };
