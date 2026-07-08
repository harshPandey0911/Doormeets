import React, { memo } from 'react';
import { AiFillStar } from 'react-icons/ai';

const ServiceWithRatingCard = memo(({
  image, title, rating, reviews,
  price, originalPrice, discount,
  onClick, onAddClick, compact = false
}) => {
  return (
    <div
      className={`${compact ? 'min-w-[170px] w-[170px] lg:min-w-full' : 'min-w-[180px] w-[180px] lg:min-w-full'} rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5 active:scale-98 group bg-surface border border-transparent shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_45px_rgba(255,107,74,0.06)] hover:border-brand/15`}
      onClick={onClick}
    >
      {/* ── Image ── */}
      <div className="relative overflow-hidden aspect-[4/3] w-full">
        {discount && (
          <div
            className="absolute top-3 left-3 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-md z-10 bg-gradient-to-r from-brand to-brand-light border border-white/10 uppercase tracking-wider"
          >
            {discount} OFF
          </div>
        )}

        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-card-bg border-b border-border/60"
          >
            <img
              src="/cleaning-expert-logo.png"
              alt="Placeholder"
              className="w-12 h-12 object-contain opacity-30 grayscale"
            />
          </div>
        )}
      </div>

      {/* ── Mobile Layout ── */}
      <div className={`${compact ? 'p-3' : 'p-4'} lg:hidden flex flex-col justify-between h-[120px]`}>
        <div className="space-y-1">
          <h3
            className="text-[13px] font-bold leading-snug line-clamp-2 text-dark-text group-hover:text-brand transition-colors"
          >
            {title}
          </h3>

          {rating && (
            <div className="flex items-center gap-1">
              <AiFillStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-black text-dark-text">
                {rating}
              </span>
              {reviews && (
                <span className="text-[10px] text-muted-text font-medium">
                  ({reviews})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[15px] font-extrabold text-dark-text">
              {price && !isNaN(price.toString().replace(/[,]/g, ''))
                ? `₹${price}`
                : price || 'Contact for price'}
            </span>
            {originalPrice && (
              <span className="text-[10px] line-through text-muted-text font-medium">
                ₹{originalPrice}
              </span>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onAddClick?.(); }}
            className="px-5 py-1.5 h-8 rounded-full text-xs font-black transition-all duration-300 bg-brand text-white hover:bg-brand-dark hover:shadow-[0_4px_12px_rgba(255,107,74,0.3)] active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
          >
            Add
          </button>
        </div>
      </div>

      {/* ── Desktop Layout (Zomato-style) ── */}
      <div className="hidden lg:flex flex-col justify-between p-5 h-[160px]">
        <div>
          {/* Title + Rating badge row */}
          <div className="flex items-start justify-between gap-3">
            <h3
              className="text-[15px] font-bold leading-snug line-clamp-2 flex-1 text-dark-text group-hover:text-brand transition-colors"
            >
              {title}
            </h3>

            {rating && (
              <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                <span className="text-[11px] font-black leading-none">{rating}</span>
                <AiFillStar className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              </div>
            )}
          </div>

          {/* Reviews */}
          {reviews && (
            <p className="text-[11px] text-muted-text mt-1 font-medium">
              {reviews} reviews
            </p>
          )}
        </div>

        <div>
          {/* Divider */}
          <div className="border-t border-divider mb-3" />

          {/* Price + Add button */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[16px] font-extrabold text-dark-text">
                {price && !isNaN(price.toString().replace(/[,]/g, ''))
                  ? `₹${price}`
                  : price || 'Contact for price'}
              </span>
              {originalPrice && (
                <span className="text-[11px] line-through text-muted-text font-medium">
                  ₹{originalPrice}
                </span>
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onAddClick?.(); }}
              className="px-6 py-2 rounded-full text-xs font-black transition-all duration-300 bg-brand text-white hover:bg-brand-dark hover:shadow-[0_4px_12px_rgba(255,107,74,0.3)] active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ServiceWithRatingCard.displayName = 'ServiceWithRatingCard';

export default ServiceWithRatingCard;
