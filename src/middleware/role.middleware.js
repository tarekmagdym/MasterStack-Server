/**
 * Role hierarchy: super_admin > admin > employee
 * authorize(...roles) - restricts to specified roles
 * canDelete()         - only super_admin and admin
 * canWrite()          - super_admin and admin can write, employee is read-only
 */

const ROLE_HIERARCHY = {
  super_admin: 3,
  admin: 2,
  employee: 1,
};

/**
 * Restrict access to specific roles
 * Usage: authorize('super_admin', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized for this action.`,
      });
    }
    next();
  };
};

/**
 * Only super_admin and admin can delete
 */
const canDelete = authorize('super_admin', 'admin');

/**
 * Only super_admin and admin can create/update
 */
const canWrite = authorize('super_admin', 'admin');

/**
 * Only super_admin can manage other admins/employees
 */
const isSuperAdmin = authorize('super_admin');

/**
 * Attach role metadata to response for frontend role-based UI
 */
const attachRoleMeta = (req, res, next) => {
  if (req.user) {
    req.roleMeta = {
      canCreate: ['super_admin', 'admin'].includes(req.user.role),
      canEdit: ['super_admin', 'admin'].includes(req.user.role),
      canDelete: ['super_admin', 'admin'].includes(req.user.role),
      canManageUsers: req.user.role === 'super_admin',
    };
  }
  next();
};

module.exports = { authorize, canDelete, canWrite, isSuperAdmin, attachRoleMeta };
