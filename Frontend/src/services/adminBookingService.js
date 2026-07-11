import api, { apiCache } from './api';

export const adminBookingService = {
  // Get all bookings with filters and search
  getAllBookings: async (params) => {
    try {
      const cacheKey = `admin:bookings:${JSON.stringify(params || {})}`;
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;

      const response = await api.get('/admin/bookings', { params });
      if (response.data.success) {
        apiCache.set(cacheKey, response.data, 5); // Cache admin list for 5 seconds
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch bookings' };
    }
  },

  // Get booking details by ID
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/admin/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch booking details' };
    }
  },

  // Get booking analytics
  getAnalytics: async (filters = {}) => {
    try {
      const cacheKey = `admin:analytics:${JSON.stringify(filters || {})}`;
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;

      const response = await api.get('/admin/bookings/analytics', { params: filters });
      if (response.data.success) {
        apiCache.set(cacheKey, response.data, 15); // Cache analytics for 15 seconds
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch analytics' };
    }
  },

  // Cancel booking
  cancelBooking: async (id, reason) => {
    try {
      const response = await api.post(`/admin/bookings/${id}/cancel`, { cancellationReason: reason });
      apiCache.invalidatePrefix('admin:bookings');
      apiCache.invalidatePrefix('admin:analytics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel booking' };
    }
  },

  // Assign vendor to booking
  assignVendor: async (id, vendorId) => {
    try {
      const response = await api.post(`/admin/bookings/${id}/assign`, { vendorId });
      apiCache.invalidatePrefix('admin:bookings');
      apiCache.invalidatePrefix('admin:analytics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to assign vendor' };
    }
  },

  // Approve cancellation request
  approveCancelBooking: async (id) => {
    try {
      const response = await api.post(`/admin/bookings/${id}/approve-cancel`);
      apiCache.invalidatePrefix('admin:bookings');
      apiCache.invalidatePrefix('admin:analytics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to approve cancellation request' };
    }
  },

  // Reject cancellation request
  rejectCancelBooking: async (id) => {
    try {
      const response = await api.post(`/admin/bookings/${id}/reject-cancel`);
      apiCache.invalidatePrefix('admin:bookings');
      apiCache.invalidatePrefix('admin:analytics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reject cancellation request' };
    }
  }
};
