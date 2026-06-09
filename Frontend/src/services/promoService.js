import api from './api';

export const promoService = {
  applyPromo: async (code, serviceId, basePrice, quantity) => {
    try {
      const response = await api.post('/public/promos/apply', {
        code,
        serviceId,
        basePrice,
        quantity
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to apply promo code' };
    }
  },
  getActivePromos: async () => {
    try {
      const response = await api.get('/public/promos');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch active promo codes' };
    }
  }
};

export default promoService;
