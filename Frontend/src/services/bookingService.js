import api, { apiCache } from './api';

/**
 * Booking Service
 * Handles all API calls for Bookings
 */

export const bookingService = {
  // Create a new booking
  create: async (bookingData) => {
    console.log('[BookingService] Creating booking with payload:', JSON.stringify(bookingData, null, 2));
    const response = await api.post('/users/bookings', bookingData);
    
    // Invalidate bookings cache on creation to show fresh data (Rule 5 & 6)
    apiCache.invalidatePrefix('user:bookings');
    
    return response.data;
  },

  // Get user bookings with filters
  getUserBookings: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const cacheKey = `user:bookings:${queryParams.toString()}`;
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get(`/users/bookings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);
    if (response.data.success) {
      apiCache.set(cacheKey, response.data, 15); // Cache bookings list for 15 seconds (Rule 5)
    }
    return response.data;
  },

  // Get unique past services for Order Again section (highly optimized)
  getPastServices: async () => {
    const cacheKey = 'user:bookings:past-services';
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    const response = await api.get('/users/bookings/past-services');
    if (response.data.success) {
      apiCache.set(cacheKey, response.data, 60); // Cache past services for 60 seconds
    }
    return response.data;
  },


  // Get booking details by ID
  getById: async (id) => {
    const response = await api.get(`/users/bookings/${id}`);
    return response.data;
  },

  // Cancel booking
  cancel: async (id, cancellationReason) => {
    const response = await api.post(`/users/bookings/${id}/cancel`, { cancellationReason });
    apiCache.invalidatePrefix('user:bookings');
    return response.data;
  },

  // Reschedule booking
  reschedule: async (id, rescheduleData) => {
    const response = await api.put(`/users/bookings/${id}/reschedule`, rescheduleData);
    apiCache.invalidatePrefix('user:bookings');
    return response.data;
  },

  // Add review and rating
  addReview: async (id, reviewData) => {
    const response = await api.post(`/users/bookings/${id}/review`, reviewData);
    apiCache.invalidatePrefix('user:bookings');
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

