import api from './api';

const stockService = {
  // Admin Methods
  getAllRequests: async (params = {}) => {
    const response = await api.get('/stock/admin/all', { params });
    return response.data;
  },
  
  updateRequestStatus: async (requestId, data) => {
    const response = await api.put(`/stock/admin/${requestId}/status`, data);
    return response.data;
  }
};

export default stockService;
