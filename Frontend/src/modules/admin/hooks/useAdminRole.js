import { useState, useEffect, useMemo } from 'react';

/**
 * useAdminRole Hook
 * 
 * Returns role info and permission helpers for the logged-in admin.
 * Reads from sessionStorage or localStorage.
 * 
 * Usage:
 *   const { isSuperAdmin, hasPermission, canAccessCity } = useAdminRole();
 */
const useAdminRole = () => {
  const [admin, setAdmin] = useState(() => {
    try {
      const storedData = sessionStorage.getItem('adminData') || localStorage.getItem('adminData');
      if (storedData) {
        return JSON.parse(storedData);
      }
    } catch (e) {
      console.error('Failed to parse admin data in useAdminRole:', e);
    }
    return null;
  });

  useEffect(() => {
    if (admin && admin.role) {
      // Refresh profile to get latest permissions
      import('../../../services/authService').then(({ adminAuthService }) => {
        adminAuthService.getProfile().then((res) => {
          if (res.success && res.data) {
            setAdmin(res.data);
          }
        }).catch(err => console.error('Failed to refresh admin profile:', err));
      }).catch(err => console.error('Failed to import authService:', err));
    }
  }, []);

  const role = admin?.role || '';

  const isSuperAdmin = useMemo(() => {
    return role === 'SUPER_ADMIN' || role === 'super_admin';
  }, [role]);

  const isCityAdmin = useMemo(() => {
    return role === 'CITY_ADMIN' || role === 'admin';
  }, [role]);

  /**
   * Check if admin has a specific permission key
   * Super Admin always returns true.
   */
  const hasPermission = useMemo(() => (permKey) => {
    if (isSuperAdmin) return true;
    if (!admin?.permissions) return false;
    const perm = admin.permissions.find(p => p.key === permKey);
    return perm ? perm.enabled : false;
  }, [isSuperAdmin, admin]);

  /**
   * Check if admin can access a specific city (by ID)
   * Super Admin always returns true.
   */
  const canAccessCity = useMemo(() => (cityId) => {
    if (isSuperAdmin) return true;
    if (!cityId) return true;
    if (!admin?.assignedCities) return false;
    return admin.assignedCities.some(c => {
      const id = typeof c === 'object' ? c._id : c;
      return id?.toString() === cityId?.toString();
    });
  }, [isSuperAdmin, admin]);

  const assignedCities = admin?.assignedCities || [];
  const permissions = admin?.permissions || [];
  const canApproveVendors = isSuperAdmin || admin?.canApproveVendors || false;
  const canApproveWorkers = isSuperAdmin || admin?.canApproveWorkers || false;

  return {
    admin,
    role,
    isSuperAdmin,
    isCityAdmin,
    hasPermission,
    canAccessCity,
    assignedCities,
    permissions,
    canApproveVendors,
    canApproveWorkers
  };
};

export default useAdminRole;

