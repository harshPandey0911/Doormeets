import React, { memo, useRef } from 'react';
import { AiFillStar } from 'react-icons/ai';
import { themeColors } from '../../../../theme';
import { optimizeCloudinaryUrl } from '../../../../utils/cloudinaryOptimize';

const DetailedServiceCard = memo(({ image, title, rating, reviews, price, originalPrice, discount, onClick, onAddClick, isPriceDisclosed = true }) => {
  const cardRef = useRef(null);

  // Format price (remove non-digits, then format)
  const formatPrice = (p) => {
    if (!p) return null;
    const clean = p.toString().replace(/[^0-9]/g, '');
    return new Intl.NumberFormat('en-IN').format(clean);
  };

  const displayPrice = formatPrice(price);
  const displayOriginalPrice = formatPrice(originalPrice);

  return (
    <div
      ref={cardRef}
      className="min-w-[200px] flex flex-col bg-surface rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 border border-border/80 shadow-sm hover:shadow-xl hover:shadow-brand/5 hover:border-brand/30 hover:-translate-y-1.5 active:scale-98"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {discount && isPriceDisclosed && (
          <div
            className="absolute top-3 left-3 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-md z-10 bg-gradient-to-r from-brand to-brand-light border border-white/10 uppercase tracking-wider"
          >
            {discount.toString().toUpperCase().includes('OFF') ? discount : `${discount}% OFF`}
          </div>
        )}
        {image ? (
          <img
            src={optimizeCloudinaryUrl(image, { width: 400, quality: 'auto' })}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-card-bg border-b border-border/60">
            <span className="text-xs font-bold text-brand/40 uppercase tracking-widest">No Image</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between min-h-[140px]">
        <div>
          <h3 className="text-[13px] font-bold text-dark-text leading-snug mb-1 line-clamp-2 group-hover:text-brand transition-colors">{title}</h3>

          {rating && (
            <div className="flex items-center gap-1 mb-2">
              <AiFillStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs text-dark-text font-black">{rating}</span>
              {reviews && (
                <span className="text-[10px] text-muted-text font-medium">({reviews})</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-divider">
          <div className="flex items-baseline gap-1">
            {isPriceDisclosed ? (
              <>
                {displayOriginalPrice && (
                  <span className="text-[10px] text-muted-text line-through font-medium">₹{displayOriginalPrice}</span>
                )}
                <span className="text-[14px] font-extrabold text-dark-text">₹{displayPrice}</span>
              </>
            ) : (
              <span className="text-[9px] font-black text-muted-text uppercase tracking-wider bg-card-bg px-2 py-0.5 rounded-md border border-border/60">Not Disclosed</span>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onAddClick?.(); }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-brand/20 bg-brand/5 text-brand hover:bg-brand hover:text-white hover:border-brand hover:shadow-lg hover:shadow-brand/10 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            Book
          </button>
        </div>
      </div>
    </div >
  );
});

DetailedServiceCard.displayName = 'DetailedServiceCard';

export default DetailedServiceCard;

