import api from '../../../services/api';

export const requestConsultation = async (data) => {
  const response = await api.post('/users/painting-consultations/request', data);
  return response.data;
};

export const getMyConsultations = async () => {
  const response = await api.get('/users/painting-consultations/my-requests');
  return response.data;
};

export const quoteAction = async (id, action, extras = {}) => {
  const response = await api.put(`/users/painting-consultations/${id}/quote-action`, { action, ...extras });
  return response.data;
};
