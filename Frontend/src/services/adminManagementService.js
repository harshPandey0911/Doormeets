import api from './api';

const adminManagementService = {
  /**
   * Get all admins (Super Admin only)
   */
  getAllAdmins: async () => {
    const response = await api.get('/admin/admins');
    return response.data;
  },

  /**
   * Create a new City Admin
   * @param {Object} data - { name, email, password, role, assignedCities, permissions, canApproveVendors, canApproveWorkers }
   */
  createAdmin: async (data) => {
    const response = await api.post('/admin/admins', data);
    return response.data;
  },

  /**
   * Update admin details
   */
  updateAdmin: async (id, data) => {
    const response = await api.put(`/admin/admins/${id}`, data);
    return response.data;
  },

  /**
   * Update admin permissions only
   * @param {string} id - Admin ID
   * @param {Object} data - { permissions, assignedCities, canApproveVendors, canApproveWorkers }
   */
  updateAdminPermissions: async (id, data) => {
    const response = await api.put(`/admin/admins/${id}/permissions`, data);
    return response.data;
  },

  /**
   * Toggle admin active/inactive
   */
  toggleAdminStatus: async (id) => {
    const response = await api.patch(`/admin/admins/${id}/status`);
    return response.data;
  },

  /**
   * Delete admin
   */
  deleteAdmin: async (id) => {
    const response = await api.delete(`/admin/admins/${id}`);
    return response.data;
  },

  // ───── City Admin Requests ─────

  /**
   * Get all city admin requests
   * Super Admin sees all, City Admin sees only their own
   */
  getCityAdminRequests: async (params = {}) => {
    const response = await api.get('/admin/city-admin-requests', { params });
    return response.data;
  },

  /**
   * Get pending request count (Super Admin badge)
   */
  getPendingRequestCount: async () => {
    const response = await api.get('/admin/city-admin-requests/pending-count');
    return response.data;
  },

  /**
   * City Admin submits a proposal
   * @param {Object} data - { requestType, proposedData, cityId, notes }
   */
  submitRequest: async (data) => {
    const response = await api.post('/admin/city-admin-requests', data);
    return response.data;
  },

  /**
   * Super Admin approves a request
   */
  approveRequest: async (id) => {
    const response = await api.post(`/admin/city-admin-requests/${id}/approve`);
    return response.data;
  },

  /**
   * Super Admin rejects a request
   */
  rejectRequest: async (id, reason) => {
    const response = await api.post(`/admin/city-admin-requests/${id}/reject`, { reason });
    return response.data;
  }
};

export default adminManagementService;
