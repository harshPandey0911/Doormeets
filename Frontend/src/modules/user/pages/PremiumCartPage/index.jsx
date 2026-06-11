import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiMapPin, FiPackage } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/premium/Navbar';
import BottomCheckoutBar from '../../components/premium/BottomCheckoutBar';
import QuantityButton from '../../components/premium/QuantityButton';
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

  const total = useMemo(() => cartItems.reduce((sum, item) => sum + (item.price || 0), 0), [cartItems]);
  const originalTotal = useMemo(() => cartItems.reduce((sum, item) => {
    const unit = item.originalPrice || item.unitPrice || item.price || 0;
    return sum + (unit * (item.serviceCount || 1));
  }, 0), [cartItems]);

  const savings = Math.max(0, originalTotal - total);

  const handleCheckout = () => {
    if (!cartItems.length) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/user/checkout');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#FDE8E8_0%,#FDF2F2_40%,#FFFFFF_100%)] pb-44">
      <Navbar locationLabel={currentCity?.name || 'Select location'} cartCount={cartCount} onSearchClick={() => {}} onLocationClick={() => navigate('/user/home')} />

      <div className="mx-auto max-w-4xl px-4 pt-[80px] pb-5 md:px-6">
        <div className="py-4 px-1">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-100 p-3 text-gray-900"><FiMapPin /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">Address</p>
              <h1 className="text-base font-bold text-[#111827] tracking-tight">{localStorage.getItem('currentAddress') || 'Select delivery address'}</h1>
            </div>
          </div>
        </div>

        {savings > 0 ? (
          <div className="mt-4 rounded-[30px] border border-emerald-100 bg-emerald-50 px-5 py-4 text-emerald-800 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.24em]">Savings banner</div>
            <div className="mt-1 text-sm font-semibold">You save ₹{savings} on this booking</div>
          </div>
        ) : null}

        <div className="mt-5 space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="py-4 px-1">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gray-100 p-3 text-gray-900"><FiPackage /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">Grouped services</p>
                  <h3 className="text-base font-bold text-[#111827] tracking-tight">{category}</h3>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item._id || item.id} className="rounded-[22px] border border-gray-100 bg-linear-to-br from-white to-gray-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-[#111827]">{item.card?.title || item.title}</div>
                        <div className="mt-1 text-[11px] leading-5 text-gray-500">{item.card?.subtitle || item.description}</div>
                        <div className="mt-2 text-sm font-bold text-gray-900">₹{item.card?.price || item.price}</div>
                      </div>
                      <QuantityButton
                        quantity={item.serviceCount || 1}
                        onIncrement={() => updateItem(item._id || item.id, (item.serviceCount || 1) + 1)}
                        onDecrement={() => {
                          if ((item.serviceCount || 1) <= 1) {
                            removeItem(item._id || item.id);
                          } else {
                            updateItem(item._id || item.id, (item.serviceCount || 1) - 1);
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!cartItems.length ? (
            <div className="rounded-[30px] border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-900">
                <FiPackage className="text-2xl" />
              </div>
              <div className="text-base font-bold text-[#111827]">Your cart is empty</div>
              <p className="mt-2 text-xs text-gray-500">Add a service from home, category or brand page.</p>
              <button type="button" onClick={() => navigate('/user/home')} className="mt-4 rounded-2xl bg-gradient-to-r from-[#B33A35] to-[#9E2E2A] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-orange-100/50 hover:opacity-90 active:scale-95 transition-all">
                Browse services
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <BottomCheckoutBar total={total} originalTotal={originalTotal} buttonText="Order" onClick={handleCheckout} note="" />
    </div>
  );
};

export default PremiumCartPage;
