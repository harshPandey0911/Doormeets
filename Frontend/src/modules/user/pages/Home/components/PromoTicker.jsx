import React from 'react';

const PromoTicker = ({ promos = [] }) => {
  if (!promos || promos.length === 0) return null;

  // Format promo messages
  const tickerItems = promos.map(promo => {
    const discountText = promo.discountType === 'percentage' 
      ? `${promo.discountValue}% OFF` 
      : `₹${promo.discountValue} OFF`;
      
    const minOrderText = promo.minOrderValue > 0 
      ? ` (Min Order: ₹${promo.minOrderValue})` 
      : '';
      
    const appliesToText = promo.appliesTo === 'all' 
      ? 'all bookings' 
      : promo.appliesTo === 'category' && promo.categoryId?.title
      ? `on ${promo.categoryId.title}`
      : promo.appliesTo === 'service' && promo.serviceId?.title
      ? `on ${promo.serviceId.title}`
      : 'selected items';

    return `Use code ${promo.code} to get ${discountText} ${appliesToText}${minOrderText}`;
  });

  return (
    <div className="relative w-full overflow-hidden bg-white border-y border-white/50 py-2.5 select-none z-10 -mt-5 mb-4">
      <div className="flex whitespace-nowrap">
        {/* First marquee list */}
        <div className="animate-marquee flex gap-10 pr-10 text-[#FF9F45] text-xs font-bold tracking-wide uppercase shrink-0">
          {tickerItems.map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-2">
              <span className="text-sm">🎟️</span> {item}
            </span>
          ))}
        </div>
        {/* Duplicated list to make loop seamless */}
        <div className="animate-marquee flex gap-10 pr-10 text-[#FF9F45] text-xs font-bold tracking-wide uppercase shrink-0" aria-hidden="true">
          {tickerItems.map((item, idx) => (
            <span key={`dup-${idx}`} className="inline-flex items-center gap-2">
              <span className="text-sm">🎟️</span> {item}
            </span>
          ))}
        </div>
      </div>
      
      {/* CSS marquee logic */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        /* pause on hover to let users read detail comfortably, but not on touch devices via tap */
        @media (hover: hover) {
          .relative:hover .animate-marquee {
            animation-play-state: paused;
          }
        }
      `}</style>
    </div>
  );
};

export default PromoTicker;
