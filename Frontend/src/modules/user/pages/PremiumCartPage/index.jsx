import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiPackage, FiStar, FiMinus, FiPlus, FiShoppingBag, FiArrowLeft, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useCart } from '../../../../context/CartContext';
import { useCity } from '../../../../context/CityContext';
import { useTheme } from '../../../../context/ThemeContext';

/* ── helper: compute visit dates from workflow steps ─────────── */
const computeVisitDates = (workflow) => {
  if (!workflow?.steps?.length) return [];
  const today = new Date();
  let cumulativeDays = 0;

  return workflow.steps
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    .map((step, idx) => {
      cumulativeDays += step.daysAfterPreviousVisit || 0;
      const visitDate = new Date(today);
      visitDate.setDate(today.getDate() + cumulativeDays);
      return {
        sequence: idx + 1,
        title: step.title,
        date: visitDate,
        daysOffset: cumulativeDays,
        isToday: cumulativeDays === 0
      };
    });
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
/* ─────────────────────────────────────────────────────────────── */

const PremiumCartPage = () => {
  const navigate = useNavigate();
  const { currentCity } = useCity();
  const { isDark } = useTheme();
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
    cartItems.reduce((sum, item) => {
      const unit = item.unitPrice || (item.price / (item.serviceCount || 1));
      return sum + (unit * (item.serviceCount || 1));
    }, 0),
    [cartItems]
  );

  const originalTotal = useMemo(() =>
    cartItems.reduce((sum, item) => {
      const unit = item.originalPrice || item.unitPrice || (item.price / (item.serviceCount || 1));
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
        className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: 'var(--background)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
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
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-4 pb-6">


        {/* Empty cart */}
        {!cartItems.length ? (
          <div
            className="rounded-md border border-dashed p-12 text-center"
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
              className="px-6 py-3 rounded-md text-sm font-semibold text-white transition-all active:scale-95 hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Browse services
            </button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">
            {/* LEFT: Cart items */}
            <div>
            {/* Cart items grouped by category */}
            <div className="space-y-4 mb-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div
                  key={category}
                  className="rounded-md border overflow-hidden"
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

                            {/* Selected Add-Ons / Dynamic Fields */}
                            {Array.isArray(item.dynamicFields) && item.dynamicFields.length > 0 && (() => {
                              const rendered = new Set();
                              const filteredFields = item.dynamicFields.filter(field => {
                                if (!field.value || String(field.value).includes('Skipped') || String(field.value).includes("I don't need this")) return false;
                                const key = `${field.label}:${field.value}`;
                                if (rendered.has(key)) return false;
                                rendered.add(key);
                                return true;
                              });
                              if (filteredFields.length === 0) return null;
                              return (
                                <div 
                                  className="mt-2 space-y-1 p-2 rounded-md border"
                                  style={{
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
                                    borderColor: isDark ? '#232733' : '#F1F5F9'
                                  }}
                                >
                                  {filteredFields.map((field, fIdx) => (
                                    <p 
                                      key={fIdx} 
                                      className="text-[11px] leading-tight"
                                      style={{ color: isDark ? '#CBD5E1' : '#6B7280' }}
                                    >
                                      <span className="font-semibold" style={{ color: isDark ? '#F8FAFC' : '#374151' }}>{field.label}:</span> {field.value}
                                    </p>
                                  ))}
                                </div>
                              );
                            })()}

                            {/* Price */}
                            <div className="flex items-baseline gap-1.5 mt-2">
                              <span
                                className="text-sm font-bold"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                ₹{(item.unitPrice || (item.price / (item.serviceCount || 1))) * (item.serviceCount || 1)}
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

                            {/* Visit Schedule Timeline for multi_visit */}
                            {item.serviceType === 'multi_visit' && item.workflow?.steps?.length > 0 && (() => {
                              const visits = computeVisitDates(item.workflow);
                              if (!visits.length) return null;
                              return (
                                <div
                                  className="mt-3 p-3 rounded-md border"
                                  style={{
                                    backgroundColor: isDark ? 'rgba(99,102,241,0.06)' : '#F0F4FF',
                                    borderColor: isDark ? 'rgba(99,102,241,0.15)' : '#DBEAFE'
                                  }}
                                >
                                  <div className="flex items-center gap-1.5 mb-2.5">
                                    <FiCalendar className="w-3.5 h-3.5" style={{ color: isDark ? '#818CF8' : '#6366F1' }} />
                                    <span
                                      className="text-[11px] font-bold uppercase tracking-wider"
                                      style={{ color: isDark ? '#818CF8' : '#6366F1' }}
                                    >
                                      Visit Schedule
                                    </span>
                                  </div>
                                  <div className="relative">
                                    {visits.map((visit, vIdx) => (
                                      <div key={vIdx} className="flex items-start gap-2.5 relative" style={{ paddingBottom: vIdx < visits.length - 1 ? '12px' : '0' }}>
                                        {/* Timeline line */}
                                        {vIdx < visits.length - 1 && (
                                          <div
                                            className="absolute"
                                            style={{
                                              left: '7px',
                                              top: '16px',
                                              bottom: '0',
                                              width: '2px',
                                              backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#C7D2FE',
                                              borderRadius: '1px'
                                            }}
                                          />
                                        )}
                                        {/* Timeline dot */}
                                        <div
                                          className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                                          style={{
                                            backgroundColor: visit.isToday
                                              ? (isDark ? '#34D399' : '#10B981')
                                              : (isDark ? '#818CF8' : '#6366F1'),
                                            boxShadow: visit.isToday
                                              ? '0 0 0 3px rgba(16,185,129,0.15)'
                                              : '0 0 0 3px rgba(99,102,241,0.1)'
                                          }}
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        </div>
                                        {/* Visit info */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span
                                              className="text-[11px] font-bold"
                                              style={{ color: isDark ? '#F1F5F9' : '#1E293B' }}
                                            >
                                              Visit {visit.sequence}
                                            </span>
                                            {visit.isToday && (
                                              <span
                                                className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                                                style={{
                                                  backgroundColor: isDark ? 'rgba(52,211,153,0.15)' : '#D1FAE5',
                                                  color: isDark ? '#34D399' : '#059669'
                                                }}
                                              >
                                                Today
                                              </span>
                                            )}
                                            {!visit.isToday && (
                                              <span
                                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                                                style={{
                                                  backgroundColor: isDark ? 'rgba(129,140,248,0.12)' : '#EEF2FF',
                                                  color: isDark ? '#A5B4FC' : '#6366F1'
                                                }}
                                              >
                                                +{visit.daysOffset} days
                                              </span>
                                            )}
                                          </div>
                                          <p
                                            className="text-[10px] mt-0.5 leading-tight"
                                            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
                                          >
                                            {visit.title} — <span className="font-semibold" style={{ color: isDark ? '#CBD5E1' : '#334155' }}>{formatDate(visit.date)}</span>
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Right: qty + remove */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {/* Quantity control */}
                            <div
                              className="flex items-center rounded-md border overflow-hidden"
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
            </div>

            {/* RIGHT: Payment summary + Continue (sidebar on desktop, bottom on mobile) */}
            <div className="lg:sticky lg:top-24">
            <div
              className="rounded-md border p-4 mb-6"
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
              className="w-full py-4 rounded-md text-sm font-bold text-white transition-all active:scale-[0.98] hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Continue
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumCartPage;
