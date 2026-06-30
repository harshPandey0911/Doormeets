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
