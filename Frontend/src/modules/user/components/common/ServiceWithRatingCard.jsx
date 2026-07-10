import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { AiFillStar } from 'react-icons/ai';

const ServiceWithRatingCard = memo(({
  image, title, rating, reviews,
  price, originalPrice, discount,
  onClick, onAddClick, compact = false,
  slug
}) => {
  const displayPrice = price && !isNaN(price.toString().replace(/[,]/g, ''))
    ? `₹${price}`
    : price || 'Contact for price';

  const cardContent = (
    <div className="w-[110px] min-w-[110px] flex flex-col group transition-all duration-300">
      {/* Image container */}
      <div className="w-full aspect-square rounded-[20px] bg-gray-50 overflow-hidden relative mb-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        {discount && (
          <div className="absolute top-2 left-2 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10">
            {discount.toString().toUpperCase().includes('OFF') ? discount : `${discount}% OFF`}
          </div>
        )}
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <img
              src="/cleaning-expert-logo.png"
              alt="Placeholder"
              className="w-8 h-8 object-contain opacity-40 grayscale"
            />
          </div>
        )}
      </div>

      {/* Info below image */}
      <div className="flex flex-col flex-1 px-0.5">
        <h3 className="text-[11px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2 min-h-[32px] mb-1">
          {title}
        </h3>

        {rating && (
          <div className="flex items-center gap-1 mb-1 text-[10.5px] text-gray-600 font-medium">
            <AiFillStar className="w-3.5 h-3.5 text-yellow-400" />
            <span>{rating}</span>
            {reviews && (
              <span className="text-gray-400">({reviews})</span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-1 mt-auto">
          <span className="text-[11.5px] font-bold text-[#1A1A1A]">
            {displayPrice}
          </span>
          {originalPrice && (
            <span className="text-[10px] text-gray-400 line-through">
              ₹{originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const containerClasses = "min-w-[110px] w-[110px]";

  if (slug) {
    return (
      <Link 
        to={`/user/service/${slug}`} 
        className={`${containerClasses} block cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-95`}
        onClick={onClick}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div 
      className={`${containerClasses} cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-95`}
      onClick={onClick}
    >
      {cardContent}
    </div>
  );
});

ServiceWithRatingCard.displayName = 'ServiceWithRatingCard';

export default ServiceWithRatingCard;

