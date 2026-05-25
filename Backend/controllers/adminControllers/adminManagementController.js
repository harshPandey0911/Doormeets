const Admin = require('../../models/Admin');
const { validationResult } = require('express-validator');
const { PERMISSION_KEYS } = require('../../utils/constants');

/**
 * Get all admins (Super Admin only)
 */
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find()
      .select('-password')
      .populate('cityId', 'name')
      .populate('assignedCities', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
};

/**
 * Create new admin (Super Admin only)
 */
const createAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name, email, password, role,
      cityId, cityName,
      assignedCities, permissions,
      canApproveVendors, canApproveWorkers
    } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    // Build permissions array from provided keys
    const permissionsArray = (permissions || []).map(key => ({
      key,
      enabled: true
    }));

    // Create new admin
    const admin = await Admin.create({
      name,
      email,
      password,
      role: role || 'CITY_ADMIN',
      cityId: cityId || null,
      cityName: cityName || '',
      assignedCities: assignedCities || [],
      permissions: permissionsArray,
      canApproveVendors: canApproveVendors || false,
      canApproveWorkers: canApproveWorkers || false,
      createdBySuperAdmin: true
    });

    await admin.populate('assignedCities', 'name slug');

    res.status(201).json({
      success: true,
      message: 'City Admin created successfully',
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        assignedCities: admin.assignedCities,
        permissions: admin.permissions,
        canApproveVendors: admin.canApproveVendors,
        canApproveWorkers: admin.canApproveWorkers
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
};

/**
 * Delete admin (Super Admin only)
 * Note: Primary super admin (admin@admin.com) cannot be deleted
 */
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Protect primary super admin
    if (admin.email === 'admin@admin.com') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the primary super admin account'
      });
    }

    await Admin.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete admin' });
  }
};

/**
 * Update admin role (Super Admin only)
 */
const updateAdminRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['SUPER_ADMIN', 'CITY_ADMIN', 'super_admin', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Prevent self-demotion
    if (id === req.user.id && role === 'CITY_ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Admin role updated successfully',
      data: admin
    });
  } catch (error) {
    console.error('Update admin role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update admin role' });
  }
};

/**
 * Update admin permissions (Super Admin only)
 * PUT /api/admin/admins/:id/permissions
 */
const updateAdminPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, assignedCities, canApproveVendors, canApproveWorkers } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (permissions !== undefined) {
      // permissions is an array of { key, enabled } OR just string keys with enabled:true
      admin.permissions = permissions.map(p => {
        if (typeof p === 'string') return { key: p, enabled: true };
        return { key: p.key, enabled: p.enabled !== false };
      }).filter(p => PERMISSION_KEYS.includes(p.key));
    }

    if (assignedCities !== undefined) {
      admin.assignedCities = assignedCities;
    }

    if (canApproveVendors !== undefined) {
      admin.canApproveVendors = canApproveVendors;
    }

    if (canApproveWorkers !== undefined) {
      admin.canApproveWorkers = canApproveWorkers;
    }

    await admin.save();
    await admin.populate('assignedCities', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Permissions updated successfully',
      data: {
        id: admin._id,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
        assignedCities: admin.assignedCities,
        canApproveVendors: admin.canApproveVendors,
        canApproveWorkers: admin.canApproveWorkers
      }
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to update permissions' });
  }
};

module.exports = {
  getAllAdmins,
  createAdmin,
  deleteAdmin,
  updateAdminRole,
  updateAdminPermissions,

  /**
   * Update admin details (Super Admin only)
   */
  updateAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, password, role, cityId, cityName, assignedCities, canApproveVendors, canApproveWorkers } = req.body;

      // Find admin
      let admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      // Check email uniqueness if changed
      if (email && email !== admin.email) {
        const existing = await Admin.findOne({ email });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email already in use' });
        }
      }

      // Update fields
      if (name) admin.name = name;
      if (email) admin.email = email;
      if (password) admin.password = password; // Pre-save hook will hash it
      if (cityId !== undefined) admin.cityId = cityId || null;
      if (cityName !== undefined) admin.cityName = cityName || '';
      if (assignedCities !== undefined) admin.assignedCities = assignedCities;
      if (canApproveVendors !== undefined) admin.canApproveVendors = canApproveVendors;
      if (canApproveWorkers !== undefined) admin.canApproveWorkers = canApproveWorkers;

      if (req.body.permissions !== undefined) {
        admin.permissions = req.body.permissions.map(p => {
          if (typeof p === 'string') return { key: p, enabled: true };
          return { key: p.key, enabled: p.enabled !== false };
        }).filter(p => PERMISSION_KEYS.includes(p.key));
      }

      const validRoles = ['SUPER_ADMIN', 'CITY_ADMIN', 'super_admin', 'admin'];
      if (role && validRoles.includes(role)) {
        if (id === req.user.id && role === 'CITY_ADMIN') {
          return res.status(400).json({ success: false, message: 'Cannot demote yourself' });
        }
        admin.role = role;
      }

      await admin.save();
      await admin.populate('assignedCities', 'name slug');

      res.status(200).json({
        success: true,
        message: 'Admin updated successfully',
        data: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          assignedCities: admin.assignedCities,
          permissions: admin.permissions,
          canApproveVendors: admin.canApproveVendors,
          canApproveWorkers: admin.canApproveWorkers,
          isActive: admin.isActive
        }
      });
    } catch (error) {
      console.error('Update admin error:', error);
      res.status(500).json({ success: false, message: 'Failed to update admin' });
    }
  },

  /**
   * Toggle admin status (Block/Unblock)
   */
  toggleAdminStatus: async (req, res) => {
    try {
      const { id } = req.params;

      if (id === req.user.id) {
        return res.status(400).json({ success: false, message: 'Cannot block yourself' });
      }

      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }

      if (admin.email === 'admin@admin.com') {
        return res.status(400).json({ success: false, message: 'Cannot block primary super admin' });
      }

      admin.isActive = !admin.isActive;
      await admin.save();

      res.status(200).json({
        success: true,
        message: `Admin ${admin.isActive ? 'unblocked' : 'blocked'} successfully`,
        data: { isActive: admin.isActive }
      });
    } catch (error) {
      console.error('Toggle status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update status' });
    }
  }
};
