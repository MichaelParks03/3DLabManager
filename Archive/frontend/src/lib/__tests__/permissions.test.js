import { describe, it, expect } from 'vitest';
import { can, getRoleDisplayName, getAllRoles, PERMISSIONS } from '../permissions';

describe('Permissions System', () => {
  describe('PERMISSIONS constant', () => {
    it('should have all required roles defined', () => {
      expect(PERMISSIONS).toHaveProperty('admin');
      expect(PERMISSIONS).toHaveProperty('labManager');
      expect(PERMISSIONS).toHaveProperty('staff');
      expect(PERMISSIONS).toHaveProperty('viewer');
    });

    it('should give admin wildcard access', () => {
      expect(PERMISSIONS.admin).toEqual(['*']);
    });

    it('should give labManager appropriate permissions', () => {
      expect(PERMISSIONS.labManager).toContain('items.read');
      expect(PERMISSIONS.labManager).toContain('items.write');
      expect(PERMISSIONS.labManager).toContain('labs.read');
      expect(PERMISSIONS.labManager).toContain('labs.write');
    });

    it('should give staff limited permissions', () => {
      expect(PERMISSIONS.staff).toContain('items.read');
      expect(PERMISSIONS.staff).toContain('items.write');
      expect(PERMISSIONS.staff).not.toContain('labs.write');
    });

    it('should give viewer read-only permissions', () => {
      expect(PERMISSIONS.viewer).toContain('items.read');
      expect(PERMISSIONS.viewer).not.toContain('items.write');
    });
  });

  describe('can()', () => {
    it('should return true for admin with any permission', () => {
      expect(can('admin', 'items.read')).toBe(true);
      expect(can('admin', 'items.write')).toBe(true);
      expect(can('admin', 'labs.write')).toBe(true);
      expect(can('admin', 'anything.random')).toBe(true);
    });

    it('should return true for labManager with items permissions', () => {
      expect(can('labManager', 'items.read')).toBe(true);
      expect(can('labManager', 'items.write')).toBe(true);
    });

    it('should return false for labManager with admin-only permissions', () => {
      expect(can('labManager', 'users.write')).toBe(false);
    });

    it('should return true for staff with items permissions', () => {
      expect(can('staff', 'items.read')).toBe(true);
      expect(can('staff', 'items.write')).toBe(true);
    });

    it('should return false for staff with lab write permissions', () => {
      expect(can('staff', 'labs.write')).toBe(false);
    });

    it('should return true for viewer with read permissions', () => {
      expect(can('viewer', 'items.read')).toBe(true);
      expect(can('viewer', 'issues.read')).toBe(true);
    });

    it('should return false for viewer with write permissions', () => {
      expect(can('viewer', 'items.write')).toBe(false);
      expect(can('viewer', 'labs.write')).toBe(false);
    });

    it('should return false for undefined role', () => {
      expect(can(undefined, 'items.read')).toBe(false);
      expect(can(null, 'items.read')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(can('invalidRole', 'items.read')).toBe(false);
    });

    it('should return false for student role', () => {
      expect(can('student', 'items.read')).toBe(false);
    });
  });

  describe('getRoleDisplayName()', () => {
    it('should return correct display name for admin', () => {
      expect(getRoleDisplayName('admin')).toBe('Administrator');
    });

    it('should return correct display name for labManager', () => {
      expect(getRoleDisplayName('labManager')).toBe('Lab Manager');
    });

    it('should return correct display name for staff', () => {
      expect(getRoleDisplayName('staff')).toBe('Staff');
    });

    it('should return correct display name for viewer', () => {
      expect(getRoleDisplayName('viewer')).toBe('Viewer');
    });

    it('should return the role itself for unknown roles', () => {
      expect(getRoleDisplayName('unknownRole')).toBe('unknownRole');
    });
  });

  describe('getAllRoles()', () => {
    it('should return an array of roles', () => {
      const roles = getAllRoles();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
    });

    it('should return expected roles', () => {
      const roles = getAllRoles();
      expect(roles).toContain('admin');
    });
  });
});
