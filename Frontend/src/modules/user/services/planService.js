import api from '../../../services/api';
import { apiCache } from '../../../utils/apiCache';

const PLANS_CACHE_KEY = 'public:plans';

export const getPlans = async () => {
  try {
    // SWR: return stale data immediately, refresh in background if expired
    const stale = apiCache.getStale(PLANS_CACHE_KEY);
    if (stale) {
      if (apiCache.isExpired(PLANS_CACHE_KEY)) {
        api.get('/public/plans').then(res => {
          if (res.data?.success) apiCache.set(PLANS_CACHE_KEY, res.data, 300);
        }).catch(() => {});
      }
      return stale;
    }
    const response = await api.get('/public/plans');
    if (response.data?.success) apiCache.set(PLANS_CACHE_KEY, response.data, 300); // 5 min
    return response.data;
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
};

export default { getPlans };
