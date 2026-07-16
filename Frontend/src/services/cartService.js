import api from './api';
import { apiCache } from '../utils/apiCache';

/**
 * Cart Service - Backend API Based
 * All cart data stored in database
 */

const CART_CACHE_KEY = 'user:cart';

export const cartService = {
  // Get user's cart (SWR: stale data shown instantly, background refresh if expired)
  getCart: async () => {
    const stale = apiCache.getStale(CART_CACHE_KEY);
    if (stale) {
      if (apiCache.isExpired(CART_CACHE_KEY)) {
        api.get('/users/cart').then(res => {
          if (res.data?.success) apiCache.set(CART_CACHE_KEY, res.data, 10);
        }).catch(() => {});
      }
      return stale;
    }
    const response = await api.get('/users/cart');
    if (response.data?.success) {
      apiCache.set(CART_CACHE_KEY, response.data, 10);
    }
    return response.data;
  },

  // Add item to cart
  addToCart: async (itemData) => {
    const response = await api.post('/users/cart', itemData);
    apiCache.invalidate(CART_CACHE_KEY); // Invalidate cart cache on mutation
    return response.data;
  },

  // Update cart item quantity
  updateItem: async (itemId, serviceCount) => {
    const response = await api.put(`/users/cart/${itemId}`, { serviceCount });
    apiCache.invalidate(CART_CACHE_KEY);
    return response.data;
  },

  // Remove item from cart
  removeItem: async (itemId) => {
    const response = await api.delete(`/users/cart/${itemId}`);
    apiCache.invalidate(CART_CACHE_KEY);
    return response.data;
  },

  // Remove all items from a category
  removeCategoryItems: async (category) => {
    const response = await api.delete(`/users/cart/category/${encodeURIComponent(category)}`);
    apiCache.invalidate(CART_CACHE_KEY);
    return response.data;
  },

  // Clear entire cart
  clearCart: async () => {
    const response = await api.delete('/users/cart');
    apiCache.invalidate(CART_CACHE_KEY);
    return response.data;
  }
};

export default cartService;
