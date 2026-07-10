import api from '../../../services/api';

const BASE = '/admin/vendor-dashboard';

const vendorDashboardService = {
  get: () => api.get(BASE).then(r => r.data),

  // Banners
  addBanner: (data) => api.post(`${BASE}/banners`, data).then(r => r.data),
  updateBanner: (id, data) => api.put(`${BASE}/banners/${id}`, data).then(r => r.data),
  deleteBanner: (id) => api.delete(`${BASE}/banners/${id}`).then(r => r.data),

  // Announcements
  addAnnouncement: (data) => api.post(`${BASE}/announcements`, data).then(r => r.data),
  updateAnnouncement: (id, data) => api.put(`${BASE}/announcements/${id}`, data).then(r => r.data),
  deleteAnnouncement: (id) => api.delete(`${BASE}/announcements/${id}`).then(r => r.data),

  // Videos
  addVideo: (data) => api.post(`${BASE}/videos`, data).then(r => r.data),
  updateVideo: (id, data) => api.put(`${BASE}/videos/${id}`, data).then(r => r.data),
  deleteVideo: (id) => api.delete(`${BASE}/videos/${id}`).then(r => r.data),

  // Quick Links
  addQuickLink: (data) => api.post(`${BASE}/quick-links`, data).then(r => r.data),
  updateQuickLink: (id, data) => api.put(`${BASE}/quick-links/${id}`, data).then(r => r.data),
  deleteQuickLink: (id) => api.delete(`${BASE}/quick-links/${id}`).then(r => r.data),
};

export default vendorDashboardService;
