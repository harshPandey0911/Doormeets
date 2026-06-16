import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiPackage, FiStar, FiMinus, FiPlus, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useCart } from '../../../../context/CartContext';
import { useCity } from '../../../../context/CityContext';

const PremiumCartPage = () => {
  const navigate = useNavigate();
  const { currentCity } = useCity();
  const { cartItems, removeItem, updateItem, cartCount } = useCart();

  const groupedItems = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const key = item.categoryTitle || item.category || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [cartItems]);

  const itemCount = cartItems.reduce((sum, item) => sum + (item.serviceCount || 1), 0);

  const total = useMemo(() =>
    cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.serviceCount || 1)), 0),
    [cartItems]
  );

  const originalTotal = useMemo(() =>
    cartItems.reduce((sum, item) => {
      const unit = item.originalPrice || item.unitPrice || item.price || 0;
      return sum + (unit * (item.serviceCount || 1));
    }, 0),
    [cartItems]
  );

  const savings = Math.max(0, originalTotal - total);

  const handleCheckout = () => {
    if (!cartItems.length) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/user/checkout');
  };

  return (
    <div
      className="min-h-screen pb-40"
      style={{ backgroundColor: 'var(--background)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 py-4 flex items-center gap-3 border-b"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full transition-all active:scale-95"
          style={{ backgroundColor: 'var(--card-bg)' }}
        >
          <FiArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          My cart
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">


        {/* Empty cart */}
        {!cartItems.length ? (
          <div
            className="rounded-3xl border border-dashed p-12 text-center"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
          >
            <div
              className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--divider)' }}
            >
              <FiShoppingBag className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Your cart is empty
            </p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              Add a service from home, category or brand page.
            </p>
            <button
              type="button"
              onClick={() => navigate('/user/home')}
              className="px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95 hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Browse services
            </button>
          </div>
        ) : (
          <>
            {/* Cart items grouped by category */}
            <div className="space-y-4 mb-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div
                  key={category}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border)',
                  }}
                >
                  {/* Category header */}
                  <div
                    className="px-4 py-3 flex items-center gap-2 border-b"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <FiPackage className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {category}
                    </p>
                  </div>

                  {/* Items */}
                  <div className="divide-y" style={{ borderColor: 'var(--divider)' }}>
                    {items.map((item, idx) => (
                      <div key={item._id || item.id} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          {/* Left: info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-semibold leading-snug line-clamp-2"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {item.card?.title || item.title}
                            </p>

                            {/* Rating */}
                            <div className="flex items-center gap-1 mt-1">
                              <FiStar
                                className="w-3 h-3"
                                style={{ color: '#F59E0B', fill: '#F59E0B' }}
                              />
                              <span
                                className="text-xs font-semibold"
                                style={{ color: '#F59E0B' }}
                              >
                                {item.rating || 4.5}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                ({item.reviews || '1.2k'} reviews)
                              </span>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-1.5 mt-1.5">
                              <span
                                className="text-sm font-bold"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                ₹{(item.card?.price || item.price) * (item.serviceCount || 1)}
                              </span>
                              {item.originalPrice && (
                                <span
                                  className="text-xs line-through"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  ₹{item.originalPrice * (item.serviceCount || 1)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: qty + remove */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {/* Quantity control */}
                            <div
                              className="flex items-center rounded-xl border overflow-hidden"
                              style={{
                                borderColor: 'var(--primary)',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if ((item.serviceCount || 1) <= 1) {
                                    removeItem(item._id || item.id);
                                  } else {
                                    updateItem(item._id || item.id, (item.serviceCount || 1) - 1);
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center transition-all active:scale-90"
                                style={{ color: 'var(--primary)' }}
                              >
                                <FiMinus className="w-3.5 h-3.5" />
                              </button>
                              <span
                                className="w-8 text-center text-sm font-bold"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {item.serviceCount || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(item._id || item.id, (item.serviceCount || 1) + 1)
                                }
                                className="w-8 h-8 flex items-center justify-center transition-all active:scale-90"
                                style={{ color: 'var(--primary)' }}
                              >
                                <FiPlus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => removeItem(item._id || item.id)}
                              className="text-xs font-semibold transition-all"
                              style={{ color: 'var(--primary)' }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div
              className="rounded-2xl border p-4 mb-6"
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border)',
              }}
            >
              <h2 className="text-base font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                Payment summary
              </h2>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Price ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    ₹{originalTotal}
                  </span>
                </div>
                {savings > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Discount
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      -₹{savings}
                    </span>
                  </div>
                )}
                <div
                  className="border-t pt-2.5 flex items-center justify-between"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Total amount
                  </span>
                  <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    ₹{total}
                  </span>
                </div>
              </div>
            </div>

            {/* Continue / Order button */}
            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PremiumCartPage;
