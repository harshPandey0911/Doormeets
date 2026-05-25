import api from '../../../services/api';

/**
 * Service for vendor category request operations
 */
const vendorCategoryRequestService = {
  /**
   * Submit a new category request to admin
   */
  submitRequest: async ({ categoryName, reason }) => {
    const res = await api.post('/vendors/category-requests', { categoryName, reason });
    return res.data;
  },

  /**
   * Get vendor's own category requests
   */
  getMyRequests: async (status = null) => {
    const params = status ? { status } : {};
    const res = await api.get('/vendors/category-requests', { params });
    return res.data;
  }
};

export default vendorCategoryRequestService;
