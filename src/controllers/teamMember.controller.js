const TeamMember = require('../models/TeamMember.model');
const ActivityLog = require('../models/ActivityLog.model');

/**
 * Helper: Extract the preferred language from Accept-Language header.
 * Supports 'ar' and 'en'. Defaults to 'en'.
 * @param {Object} req - Express request object
 * @returns {'ar'|'en'}
 */
const getLang = (req) => {
  const lang = (req.headers['accept-language'] || '').toLowerCase().trim();
  return lang === 'ar' ? 'ar' : 'en';
};

/**
 * Helper: Localize a document's i18n fields (title, description, name)
 * in place before sending to the client.
 * The raw { ar, en } objects are replaced with the resolved string.
 * @param {Object} doc   - Plain JS object (after .lean())
 * @param {'ar'|'en'} lang
 * @returns {Object}
 */
const localizeDoc = (doc, lang) => {
  const i18nFields = ['name', 'title', 'description'];
  i18nFields.forEach((field) => {
    if (doc[field] && typeof doc[field] === 'object' && !Array.isArray(doc[field])) {
      doc[field] = doc[field][lang] || doc[field]['en'] || '';
    }
  });
  return doc;
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc   Get all published team members (public)
 * @route  GET /api/team
 * @access Public
 */
const getTeamMembers = async (req, res) => {
  try {
    const lang = getLang(req);

    const members = await TeamMember.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .select('-createdBy -updatedBy -__v')
      .lean(); // lean() returns plain JS objects — required for field mutation

    // Localize each member's i18n fields
    const localized = members.map((m) => localizeDoc(m, lang));

    res.status(200).json({ success: true, lang, data: localized });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES — return raw { ar, en } objects so the dashboard can edit both
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc   Get all team members (admin)
 * @route  GET /api/admin/team
 * @access Private
 */
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

/**
 * @desc   Create team member
 * @route  POST /api/admin/team
 * @access Private (admin+)
 */
const createTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.create({ ...req.body, createdBy: req.user._id });

    await ActivityLog.create({
      user: req.user._id,
      action: 'CREATE',
      resourceType: 'TeamMember',
      resourceId: member._id,
      // Log the English name for admin activity logs
      resourceTitle: member.name?.en || member.name,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Team member created.', data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Update team member
 * @route  PUT /api/admin/team/:id
 * @access Private (admin+)
 */
const updateTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found.' });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'UPDATE',
      resourceType: 'TeamMember',
      resourceId: member._id,
      resourceTitle: member.name?.en || member.name,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Team member updated.', data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

/**
 * @desc   Delete team member
 * @route  DELETE /api/admin/team/:id
 * @access Private (admin+)
 */
const deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Team member not found.' });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'DELETE',
      resourceType: 'TeamMember',
      resourceId: member._id,
      resourceTitle: member.name?.en || member.name,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Team member deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

module.exports = {
  getTeamMembers,
  getAllTeamMembersAdmin,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
};