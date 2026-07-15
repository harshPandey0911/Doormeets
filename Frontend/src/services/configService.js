import api from './api';
import { apiCache } from '../utils/apiCache';

const CONFIG_CACHE_KEY = 'public:config';
const CONFIG_TTL_SECONDS = 600; // 10 minutes

export const configService = {
  getSettings: async () => {
    try {
      const cached = apiCache.get(CONFIG_CACHE_KEY);
      if (cached) return { success: true, settings: cached };

      const response = await api.get('/public/config');
      if (response.data?.success && response.data?.settings) {
        apiCache.set(CONFIG_CACHE_KEY, response.data.settings, CONFIG_TTL_SECONDS);
      }
      return response.data;
    } catch (error) {
      console.error('Error getting public settings', error);
      return { success: false, settings: { visitedCharges: 29, serviceGstPercentage: 18, partsGstPercentage: 18 } };
    }
  }
};
