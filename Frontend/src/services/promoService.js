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
  }
};

export default promoService;
