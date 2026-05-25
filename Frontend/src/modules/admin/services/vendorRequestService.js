import api from '../../../services/api';

const vendorRequestService = {
  /**
   * Get all vendor category requests (admin view)
   */
  getAllRequests: async ({ status, page = 1, limit = 20 } = {}) => {
    const params = { page, limit };
    if (status) params.status = status;
    const res = await api.get('/admin/vendor-category-requests', { params });
    return res.data;
  },

  /**
   * Get pending count for sidebar badge
   */
  getPendingCount: async () => {
    const res = await api.get('/admin/vendor-category-requests/count');
    return res.data;
  },

  /**
   * Approve or reject a request
   */
  updateStatus: async (id, { status, adminNote = '' }) => {
    const res = await api.patch(`/admin/vendor-category-requests/${id}`, { status, adminNote });
    return res.data;
  }
};

export default vendorRequestService;
