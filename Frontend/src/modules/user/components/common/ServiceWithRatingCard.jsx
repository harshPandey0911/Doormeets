import React, { memo } from 'react';
import { AiFillStar } from 'react-icons/ai';

const ServiceWithRatingCard = memo(({
  image, title, rating, reviews,
  price, originalPrice, discount,
  onClick, onAddClick, compact = false
}) => {
  return (
    <div
      className={`${compact ? 'min-w-[170px] w-[170px] lg:min-w-full' : 'min-w-[180px] w-[180px] lg:min-w-full'} rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-95 group`}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
      }}
      onClick={onClick}
    >
      {/* ── Image ── */}
      <div className="relative overflow-hidden">
        {discount && (
          <div
            className="absolute top-2 left-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-10"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {discount} OFF
          </div>
        )}

        {image ? (
          <img
            src={image}
            alt={title}
            className={`w-full ${compact ? 'h-[100px] lg:h-44' : 'h-36 lg:h-52'} object-cover transition-transform duration-500 group-hover:scale-105`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            className={`w-full flex items-center justify-center border-b ${compact ? 'h-[100px] lg:h-44' : 'h-36 lg:h-52'}`}
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
            }}
          >
            <img
              src="/cleaning-expert-logo.png"
              alt="Placeholder"
              className="w-12 h-12 object-contain opacity-40 grayscale"
            />
          </div>
        )}
      </div>

      {/* ── Mobile Layout (unchanged) ── */}
      <div className={`${compact ? 'p-2' : 'p-3'} lg:hidden`}>
        <h3
          className={`text-[13px] font-semibold leading-snug mb-1 line-clamp-2 ${compact ? 'min-h-[36px]' : 'min-h-[40px]'}`}
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>

        {rating && (
          <div className={`flex items-center gap-1 ${compact ? 'mb-1' : 'mb-2'}`}>
            <AiFillStar className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              {rating}
            </span>
            {reviews && (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                ({reviews})
              </span>
            )}
          </div>
        )}

        <div className={`flex items-center justify-between mt-auto ${compact ? 'pt-1' : 'pt-2'}`}>
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {price && !isNaN(price.toString().replace(/[,]/g, ''))
                ? `₹${price}`
                : price || 'Contact for price'}
            </span>
            {originalPrice && (
              <span className="text-[11px] line-through" style={{ color: 'var(--text-muted)' }}>
                ₹{originalPrice}
              </span>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onAddClick?.(); }}
            className="px-4 py-1.5 h-8 rounded-lg text-xs font-bold transition-all active:scale-95 border"
            style={{
              backgroundColor: 'rgba(179,58,53,0.10)',
              color: 'var(--primary)',
              borderColor: 'rgba(179,58,53,0.20)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(179,58,53,0.10)';
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.borderColor = 'rgba(179,58,53,0.20)';
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* ── Desktop Layout (Zomato-style) ── */}
      <div className="hidden lg:block p-4">
        {/* Title + Rating badge row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="text-[16px] font-bold leading-snug line-clamp-2 flex-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h3>

          {rating && (
            <div className="flex items-center gap-1 shrink-0 px-2 py-1 rounded-md" style={{ backgroundColor: '#256f3a' }}>
              <span className="text-white text-[13px] font-bold leading-none">{rating}</span>
              <AiFillStar className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Reviews */}
        {reviews && (
          <p className="text-[12px] mb-3" style={{ color: 'var(--text-muted)' }}>
            {reviews} reviews
          </p>
        )}

        {/* Divider */}
        <div className="border-t mb-3" style={{ borderColor: 'var(--border)' }} />

        {/* Price + Add button */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>
              {price && !isNaN(price.toString().replace(/[,]/g, ''))
                ? `₹${price}`
                : price || 'Contact for price'}
            </span>
            {originalPrice && (
              <span className="text-[12px] line-through" style={{ color: 'var(--text-muted)' }}>
                ₹{originalPrice}
              </span>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onAddClick?.(); }}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border"
            style={{
              backgroundColor: 'rgba(179,58,53,0.10)',
              color: 'var(--primary)',
              borderColor: 'rgba(179,58,53,0.20)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(179,58,53,0.10)';
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.borderColor = 'rgba(179,58,53,0.20)';
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
});

ServiceWithRatingCard.displayName = 'ServiceWithRatingCard';

export default ServiceWithRatingCard;
