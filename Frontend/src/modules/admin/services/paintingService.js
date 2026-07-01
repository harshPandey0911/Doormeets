import api from '../../../services/api';

// ==========================================
// PAINT BRANDS
// ==========================================
export const getBrands = async () => {
  const response = await api.get('/admin/painting/brands');
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

export const deleteBrand = async (id) => {
  const response = await api.delete(`/admin/painting/brands/${id}`);
  return response.data;
};

// ==========================================
// PAINT PRODUCTS
// ==========================================
export const getProducts = async () => {
  const response = await api.get('/admin/painting/products');
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
