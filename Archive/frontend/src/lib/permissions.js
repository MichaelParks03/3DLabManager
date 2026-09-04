/**
 * Role-based permissions system for admin area
 * @typedef {'admin' | 'labManager' | 'staff' | 'viewer'} Role
 */

/**
 * @type {Record<Role, string[]>}
 */
export const PERMISSIONS = {
  admin: ["*"], // Admins have all permissions including items.position3d
  labManager: [
    "items.read",
    "items.write",
    "issues.read",
    "issues.write",
    "reports.read",
    "labs.read",
    "labs.write",
  ],
  staff: ["items.read", "items.write", "issues.read", "issues.write"],
  viewer: ["items.read", "issues.read", "issues.create"],
};

/**
 * Check if a role has a specific permission
 * @param {Role} role - User role
 * @param {string} perm - Permission to check
 * @returns {boolean}
 */
export const can = (role, perm) => {
  if (!role) return false;
  if (role === "admin") return true;
  return PERMISSIONS[role]?.includes(perm) || false;
};

/**
 * Get display name for role
 * @param {Role} role
 * @returns {string}
 */
export const getRoleDisplayName = (role) => {
  const names = {
    admin: "Administrator",
    labManager: "Lab Manager",
    staff: "Staff",
    viewer: "Viewer",
  };
  return names[role] || role;
};

/**
 * Get all available roles
 * @returns {Role[]}
 */
export const getAllRoles = () => ["admin", "ta", "student"];
