import api from './api';

export const voucherService = {
  redeemVoucher: async (code, serviceId, basePrice, quantity) => {
    try {
      const response = await api.post('/public/vouchers/redeem', {
        code,
        serviceId,
        basePrice,
        quantity
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to claim gift card' };
    }
  }
};

export default voucherService;
