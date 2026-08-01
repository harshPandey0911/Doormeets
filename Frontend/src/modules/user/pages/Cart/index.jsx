import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiLoader, FiBell } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../../theme';
import BottomNav from '../../components/layout/BottomNav';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useCart } from '../../../../context/CartContext';
import electricianIcon from '../../../../assets/images/icons/services/electrician.png';
import womensSalonIcon from '../../../../assets/images/icons/services/womens-salon-spa-icon.png';
import massageMenIcon from '../../../../assets/images/icons/services/massage-men-icon.png';
import cleaningIcon from '../../../../assets/images/icons/services/cleaning-icon.png';
import acApplianceRepairIcon from '../../../../assets/images/icons/services/ac-appliance-repair-icon.png';
import NotificationBell from '../../components/common/NotificationBell';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, isLoading: loading, removeItem, removeCategoryItems, updateItem } = useCart();

  // Category icon mapping
  const getCategoryIcon = (category) => {
    const iconMap = {
      'Electrician': electricianIcon,
      'Electricity': electricianIcon,
      "Women's Salon & Spa": womensSalonIcon,
      'Salon for Women': womensSalonIcon,
      'Salon Prime': womensSalonIcon,
      'Massage for Men': massageMenIcon,
      'Cleaning': cleaningIcon,
      'Bathroom & Kitchen Cleaning': cleaningIcon,
      'Sofa & Carpet Cleaning': cleaningIcon,
      'AC Service and Repair': acApplianceRepairIcon,
      'AC & Appliance Repair': acApplianceRepairIcon,
    };
    return iconMap[category] || electricianIcon; // Default icon
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    cartItems.forEach(item => {
      const category = item.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, [cartItems]);

  const cartCount = cartItems.length;

  const handleBack = () => {
    navigate(-1);
  };

  const handleDeleteCategory = async (category) => {
    try {
      const response = await removeCategoryItems(category);
      if (response.success) {
        toast.success('Category items removed');
      } else {
        toast.error(response.message || 'Failed to remove category items');
      }
    } catch (error) {
      toast.error('Failed to remove category items');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await removeItem(itemId);
      if (response.success) {
        toast.success('Item removed from cart');
      } else {
        toast.error(response.message || 'Failed to remove item');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleQuantityChange = async (itemId, change) => {
    try {
      const item = cartItems.find(i => (i._id || i.id) === itemId);
      if (!item) return;

      const newCount = Math.max(1, (item.serviceCount || 1) + change);
      const response = await updateItem(itemId, newCount);

      if (!response.success) {
        toast.error(response.message || 'Failed to update quantity');
      }
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleAddServices = (category) => {
    // Navigate back to home with instructions to open the category modal
    const itemsInCategory = groupedItems[category];
    const categoryId = itemsInCategory?.[0]?.categoryId;

    navigate('/user', {
      state: {
        openCategoryId: categoryId,
        openCategoryName: category
      }
    });
  };

  const handleCategoryCheckout = (category) => {
    navigate('/user/checkout', { state: { category: category } });
  };

  const handleCartClick = () => {
    // Already on cart page
  };

  // Calculate totals for all items
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalOriginalPrice = cartItems.reduce((sum, item) => {
    const unitOriginalPrice = item.originalPrice || (item.unitPrice || (item.price / (item.serviceCount || 1)));
    return sum + (unitOriginalPrice * (item.serviceCount || 1));
  }, 0);
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#B33A35]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none select-none">
        <div className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(${themeColors?.brand?.teal || '#B33A35'} 0.8px, transparent 0.8px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl border-b px-4 py-4 flex items-center justify-between" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <FiShoppingCart className="w-5 h-5" style={{ color: themeColors.button }} />
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Your Cart</h1>
              {cartCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                  {cartCount}
                </span>
              )}
            </div>
          </div>
          <NotificationBell />
        </header>

        {/* Cart Items - Grouped by Category */}
        <main className="px-4 py-4 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto" style={{ paddingBottom: cartItems.length > 0 ? '70px' : '100px' }}>
          {loading ? (
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl shadow-sm border p-4 animate-pulse" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                  {/* Category Header Skeleton */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl" style={{ backgroundColor: 'var(--border)' }}></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded" style={{ backgroundColor: 'var(--border)' }}></div>
                      <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--border)' }}></div>
                    </div>
                  </div>
                  {/* Items Skeleton */}
                  <div className="space-y-3">
                    <div className="h-10 w-full rounded" style={{ backgroundColor: 'var(--background)' }}></div>
                    <div className="h-10 w-full rounded" style={{ backgroundColor: 'var(--background)' }}></div>
                  </div>
                  {/* Buttons Skeleton */}
                  <div className="flex gap-2 mt-4">
                    <div className="flex-1 h-10 rounded-xl" style={{ backgroundColor: 'var(--border)' }}></div>
                    <div className="flex-1 h-10 rounded-xl" style={{ backgroundColor: 'var(--border)' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-full max-w-md rounded-3xl p-8 border border-dashed text-center flex flex-col items-center shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 border shadow-inner" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                  <FiShoppingCart className="w-8 h-8" style={{ color: 'var(--text-secondary)' }} />
                </div>
                <h3 className="text-base md:text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Your cart is empty</h3>
                <p className="text-xs md:text-sm font-medium mb-6 max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>Add a service from home, category or brand page.</p>
                <button
                  type="button"
                  onClick={() => navigate('/user/home')}
                  className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  style={{ backgroundColor: themeColors.button }}
                >
                  Browse services
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, items]) => {
                const categoryTotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
                const categoryIcon = getCategoryIcon(category);
                const serviceCount = items.reduce((sum, item) => sum + (item.serviceCount || 1), 0);

                return (
                  <div
                    key={category}
                    className="rounded-2xl shadow-md border"
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--border)',
                      padding: '16px'
                    }}
                  >
                    {/* Category Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Category Icon */}
                        <div
                          className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                          style={{
                            backgroundColor: `${themeColors.brand.teal}15`,
                            border: `2px solid ${themeColors.brand.teal}20`
                          }}
                        >
                          <img
                            src={categoryIcon}
                            alt={category}
                            className="w-12 h-12 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div
                            className="hidden items-center justify-center"
                            style={{
                              width: '48px',
                              height: '48px',
                              display: 'none'
                            }}
                          >
                            <FiShoppingCart className="w-8 h-8" style={{ color: themeColors.button }} />
                          </div>
                        </div>

                        {/* Category Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{category}</h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
                            {items.some(i => i.isPriceDisclosed !== false) && (
                              <> • ₹{categoryTotal.toLocaleString('en-IN')}</>
                            )}
                            {items.some(i => i.isPriceDisclosed === false) && (
                              <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter border" style={{ backgroundColor: 'var(--background)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>Partial</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Delete Category Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(category)}
                        className="p-2 rounded-full transition-colors shrink-0 cursor-pointer"
                        style={{ color: '#ef4444' }}
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Services List */}
                    <div className="mb-4 space-y-2">
                      {items.map((item) => (
                        <div key={item._id || item.id} className="flex items-start justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {item.title} X {item.serviceCount || 1}
                            </p>
                            {item.description && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                              {item.isPriceDisclosed !== false ? (
                                <>₹{(item.price || 0).toLocaleString('en-IN')}</>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--background)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>Not Disclosed</span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(item._id || item.id)}
                              className="p-1 rounded transition-colors cursor-pointer"
                              style={{ color: '#ef4444' }}
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddServices(category)}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 cursor-pointer"
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      >
                        Add Services
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCategoryCheckout(category)}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 shadow-md cursor-pointer"
                        style={{
                          backgroundColor: themeColors.button,
                          boxShadow: `0 2px 6px ${themeColors.button}4D`
                        }}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <BottomNav />
      </div>
    </div>
  );
};

export default Cart;
