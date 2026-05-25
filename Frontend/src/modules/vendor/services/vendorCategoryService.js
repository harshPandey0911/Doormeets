import api from '../../../services/api';

export const vendorCategoryService = {
  // Get all admin-managed categories for vendor (read-only)
  getCategories: async () => {
    try {
      const response = await api.get('/vendors/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get brands under a category
  getCategoryBrands: async (categoryId) => {
    try {
      const response = await api.get(`/vendors/categories/${categoryId}/brands`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get services and pricing under a brand
  getBrandServices: async (categoryId, brandId) => {
    try {
      const response = await api.get(`/vendors/categories/${categoryId}/brands/${brandId}/services`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
