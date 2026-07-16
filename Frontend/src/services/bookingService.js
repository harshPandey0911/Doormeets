import api from './api';
import { apiCache } from '../utils/apiCache';

/**
 * Booking Service
 * Handles all API calls for Bookings
 */

export const bookingService = {
  // Create a new booking
  create: async (bookingData) => {
    console.log('[BookingService] Creating booking with payload:', JSON.stringify(bookingData, null, 2));
    const response = await api.post('/users/bookings', bookingData);
    // Invalidate bookings cache on creation
    apiCache.clear();
    return response.data;
  },

  // Get user bookings with filters (SWR: stale data shown instantly, background refresh if expired)
  getUserBookings: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const cacheKey = `user:bookings:${queryParams.toString()}`;
    const url = `/users/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // SWR: return stale data immediately if available
    const stale = apiCache.getStale(cacheKey);
    if (stale) {
      // If TTL expired, silently refresh in background (no loader, no component change)
      if (apiCache.isExpired(cacheKey)) {
        api.get(url).then(res => {
          if (res.data?.success) apiCache.set(cacheKey, res.data, 15);
        }).catch(() => {});
      }
      return stale;
    }

    // First load — no cache at all, fetch normally
    const response = await api.get(url);
    if (response.data?.success) {
      apiCache.set(cacheKey, response.data, 15);
    }
    return response.data;
  },

  // Get unique past services (SWR)
  getPastServices: async () => {
    const cacheKey = 'user:bookings:past-services';
    const stale = apiCache.getStale(cacheKey);
    if (stale) {
      if (apiCache.isExpired(cacheKey)) {
        api.get('/users/bookings/past-services').then(res => {
          if (res.data?.success) apiCache.set(cacheKey, res.data, 30);
        }).catch(() => {});
      }
      return stale;
    }
    const response = await api.get('/users/bookings/past-services');
    if (response.data?.success) apiCache.set(cacheKey, response.data, 30);
    return response.data;
  },


  // Get booking details by ID (SWR)
  getById: async (id) => {
    const cacheKey = `user:booking:${id}`;
    const stale = apiCache.getStale(cacheKey);
    if (stale) {
      if (apiCache.isExpired(cacheKey)) {
        api.get(`/users/bookings/${id}`).then(res => {
          if (res.data?.success) apiCache.set(cacheKey, res.data, 15);
        }).catch(() => {});
      }
      return stale;
    }
    const response = await api.get(`/users/bookings/${id}`);
    if (response.data?.success) apiCache.set(cacheKey, response.data, 15);
    return response.data;
  },

  // Cancel booking
  cancel: async (id, cancellationReason) => {
    const response = await api.post(`/users/bookings/${id}/cancel`, { cancellationReason });
    return response.data;
  },

  // Reschedule booking
  reschedule: async (id, rescheduleData) => {
    const response = await api.put(`/users/bookings/${id}/reschedule`, rescheduleData);
    return response.data;
  },

  // Add review and rating
  addReview: async (id, reviewData) => {
    const response = await api.post(`/users/bookings/${id}/review`, reviewData);
    return response.data;
  },

  // Get user ratings and reviews
  getRatings: async (params = {}) => {
    const response = await api.get('/users/bookings/ratings', { params });
    return response.data;
  },

  // Get bids for a booking
  getBids: async (bookingId) => {
    const response = await api.get(`/bids/${bookingId}`);
    return response.data;
  },

  // Accept a bid
  acceptBid: async (bidId) => {
    const response = await api.post(`/bids/accept/${bidId}`);
    return response.data;
  },

  // Reject a bid
  rejectBid: async (bidId) => {
    const response = await api.post(`/bids/reject/${bidId}`);
    return response.data;
  }
};

export default bookingService;

