import api from '../../../services/api';

const BASE = '/admin/vendor-dashboard';

const vendorDashboardService = {
  get: () => api.get(BASE).then(r => r.data),

  // Banners & Media
  addBanner: (data) => api.post(`${BASE}/banners`, data).then(r => r.data),
  updateBanner: (id, data) => api.put(`${BASE}/banners/${id}`, data).then(r => r.data),
  deleteBanner: (id) => api.delete(`${BASE}/banners/${id}`).then(r => r.data),
};

export default vendorDashboardService;
