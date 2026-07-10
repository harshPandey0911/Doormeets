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
    <div className="w-full flex flex-col group transition-all duration-300">
      {/* Image container */}
      <div className="w-full aspect-square rounded-[20px] bg-gray-50 overflow-hidden relative mb-2">
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
              className="w-12 h-12 object-contain opacity-40 grayscale"
            />
          </div>
        )}
      </div>

      {/* Info below image */}
      <div className="flex flex-col flex-1">
        <h3 className="text-[15px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2 min-h-[40px] mb-1">
          {title}
        </h3>

        {rating && (
          <div className="flex items-center gap-1 mb-1 text-[13px] text-gray-600 font-medium">
            <AiFillStar className="w-3.5 h-3.5 text-yellow-400" />
            <span>{rating}</span>
            {reviews && (
              <span className="text-gray-400">({reviews})</span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-1.5 mt-auto">
          <span className="text-[15px] font-bold text-[#1A1A1A]">
            {displayPrice}
          </span>
          {originalPrice && (
            <span className="text-[12px] text-gray-400 line-through">
              ₹{originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const containerClasses = compact 
    ? "min-w-[140px] w-[140px] md:min-w-[170px] md:w-[170px] lg:min-w-[200px] lg:w-[200px]" 
    : "min-w-[140px] w-[140px] md:min-w-[180px] md:w-[180px] lg:min-w-[200px] lg:w-[200px]";

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

