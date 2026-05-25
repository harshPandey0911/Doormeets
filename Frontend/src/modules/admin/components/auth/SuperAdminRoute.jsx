import React from 'react';
import { Navigate } from 'react-router-dom';
import useAdminRole from '../../hooks/useAdminRole';

/**
 * SuperAdminRoute
 * 
 * Wraps a route and blocks access unless the logged-in admin is a Super Admin.
 * City Admins are redirected to /admin/dashboard.
 * 
 * Usage:
 *   <Route path="admin-management/*" element={
 *     <SuperAdminRoute><AdminManagement /></SuperAdminRoute>
 *   } />
 */
const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin } = useAdminRole();

  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default SuperAdminRoute;
