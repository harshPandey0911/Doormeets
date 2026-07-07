import api from '../../../services/api';

// ==========================================
// PAINT BRANDS
// ==========================================
export const getBrands = async (params = {}) => {
  const response = await api.get('/admin/painting/brands', { params });
  return response.data;
};

export const getBrandById = async (id) => {
  const response = await api.get(`/admin/painting/brands/${id}`);
  return response.data;
};

export const createBrand = async (data) => {
  const response = await api.post('/admin/painting/brands', data);
  return response.data;
};

export const updateBrand = async (id, data) => {
  const response = await api.put(`/admin/painting/brands/${id}`, data);
  return response.data;
};

export const updateBrandStatus = async (id, status) => {
  const response = await api.patch(`/admin/painting/brands/${id}/status`, { status });
  return response.data;
};

export const reorderBrands = async (ids) => {
  const response = await api.put('/admin/painting/brands/reorder', { ids });
  return response.data;
};

export const deleteBrand = async (id) => {
  const response = await api.delete(`/admin/painting/brands/${id}`);
  return response.data;
};

// ==========================================
// PAINT PRODUCTS
// ==========================================
export const getProducts = async (params = {}) => {
  const response = await api.get('/admin/painting/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/admin/painting/products/${id}`);
  return response.data;
};

export const createProduct = async (data) => {
  const response = await api.post('/admin/painting/products', data);
  return response.data;
};

export const updateProduct = async (id, data) => {
  const response = await api.put(`/admin/painting/products/${id}`, data);
  return response.data;
};

export const updateProductStatus = async (id, status) => {
  const response = await api.patch(`/admin/painting/products/${id}/status`, { status });
  return response.data;
};

export const updateProductFeature = async (id, isFeatured) => {
  const response = await api.patch(`/admin/painting/products/${id}/feature`, { isFeatured });
  return response.data;
};

export const updateProductRecommend = async (id, isRecommended) => {
  const response = await api.patch(`/admin/painting/products/${id}/recommend`, { isRecommended });
  return response.data;
};

export const updateProductVendorVisibility = async (id, visibleToVendor) => {
  const response = await api.patch(`/admin/painting/products/${id}/vendor-visibility`, { visibleToVendor });
  return response.data;
};

export const reorderProducts = async (ids) => {
  const response = await api.put('/admin/painting/products/reorder', { ids });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/admin/painting/products/${id}`);
  return response.data;
};

// ==========================================
// LABOUR RATES
// ==========================================
export const getLabourRates = async () => {
  const response = await api.get('/admin/painting/labour-rates');
  return response.data;
};

export const createLabourRate = async (data) => {
  const response = await api.post('/admin/painting/labour-rates', data);
  return response.data;
};

export const updateLabourRate = async (id, data) => {
  const response = await api.put(`/admin/painting/labour-rates/${id}`, data);
  return response.data;
};

export const deleteLabourRate = async (id) => {
  const response = await api.delete(`/admin/painting/labour-rates/${id}`);
  return response.data;
};

// ==========================================
// PAINTING QUOTATIONS
// ==========================================
export const getQuotations = async () => {
  const response = await api.get('/admin/painting/quotations');
  return response.data;
};

export const createQuotation = async (data) => {
  const response = await api.post('/admin/painting/quotations', data);
  return response.data;
};

export const updateQuotation = async (id, data) => {
  const response = await api.put(`/admin/painting/quotations/${id}`, data);
  return response.data;
};

export const deleteQuotation = async (id) => {
  const response = await api.delete(`/admin/painting/quotations/${id}`);
  return response.data;
};

// CONSULTATION OVERVIEW
export const getConsultationOverview = async () => {
  const response = await api.get('/admin/painting/consultation-overview');
  return response.data;
};
