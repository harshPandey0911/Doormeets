import api from '../../../services/api';

export const getAvailableConsultations = async () => {
  const response = await api.get('/vendors/painting-consultations/available');
  return response.data;
};

export const acceptConsultation = async (id) => {
  const response = await api.put(`/vendors/painting-consultations/${id}/accept`);
  return response.data;
};

export const generateQuote = async (id, data) => {
  const response = await api.post(`/vendors/painting-consultations/${id}/generate-quote`, data);
  return response.data;
};

export const declineConsultation = async (id) => {
  const response = await api.put(`/vendors/painting-consultations/${id}/decline`);
  return response.data;
};

export const getPaintingRates = async () => {
  const response = await api.get('/public/config');
  return response.data?.settings?.paintingRates || null;
};

// --- New Quotation Builder endpoints ---

export const getQuotationByConsultationId = async (consultationId) => {
  const response = await api.get(`/vendor/painting/quotations/${consultationId}`);
  return response.data;
};

export const saveQuotationDraft = async (data) => {
  const response = await api.post('/vendor/painting/quotations', data);
  return response.data;
};

export const updateQuotationDraft = async (id, data) => {
  const response = await api.put(`/vendor/painting/quotations/${id}`, data);
  return response.data;
};

export const submitQuotationToAdmin = async (id) => {
  const response = await api.post(`/vendor/painting/quotations/${id}/submit`);
  return response.data;
};

export const getPaintingProducts = async () => {
  const response = await api.get('/vendor/painting/products');
  return response.data;
};

export const getLabourRatesForVendor = async () => {
  const response = await api.get('/vendor/painting/labour-rates');
  return response.data;
};

export const getTemplatesForVendor = async () => {
  const response = await api.get('/vendor/painting/templates');
  return response.data;
};

export const getSettingsForVendor = async () => {
  const response = await api.get('/vendor/painting/settings');
  return response.data;
};
