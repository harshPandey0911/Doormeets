import React, { memo } from 'react';
import { Link } from 'react-router-dom';

const ServiceWithRatingCard = memo(({
  image, title, rating, reviews,
  price, originalPrice, discount,
  onClick, onAddClick, compact = false,
  slug
}) => {
  const [imgSrc, setImgSrc] = React.useState(image);

  React.useEffect(() => {
    setImgSrc(image);
  }, [image]);

  const displayPrice = price && !isNaN(price.toString().replace(/[,]/g, ''))
    ? `₹${price}`
    : price || 'Contact for price';

  const cardContent = (
    <div className="w-full h-full flex flex-col border rounded-[20px] p-3 shadow-[0_4px_12px_rgba(0,0,0,0.03)] group-hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] transition-all duration-300" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
      {/* Image container */}
      <div className="w-full aspect-[4/3] rounded-[12px] bg-gray-50 overflow-hidden relative mb-3">
        {discount && (
          <div className="absolute top-2 left-2 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10">
            {discount.toString().toUpperCase().includes('OFF') ? discount : `${discount}% OFF`}
          </div>
        )}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
            onError={() => setImgSrc(null)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <img
              src="/cleaning-expert-logo.png"
              alt="Placeholder"
              className="w-10 h-10 object-contain opacity-40 grayscale"
            />
          </div>
        )}
      </div>

      {/* Info below image */}
      <div className="flex flex-col flex-1 px-0.5 text-left">
        <h3 className="text-[13px] md:text-[15px] font-medium md:font-semibold leading-snug line-clamp-2 min-h-[38px] mb-1" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>

        {rating && (
          <div className="flex items-center gap-1 mb-1 text-[11px] md:text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            <span className="text-yellow-500">★</span>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{rating}</span>
            {reviews && (
              <span style={{ color: 'var(--text-muted)' }}>({reviews.toString().includes('reviews') ? reviews : `${reviews} reviews`})</span>
            )}
          </div>
        )}

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-[13px] md:text-[15px] font-extrabold" style={{ color: 'var(--text-primary)' }}>
            {displayPrice}
          </span>
          {originalPrice && (
            <span className="text-[11px] md:text-[13px] text-gray-400 line-through">
              ₹{originalPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const containerClasses = "min-w-[160px] w-[160px] md:min-w-[230px] md:w-[230px] flex";

  if (slug && !onClick) {
    return (
      <Link 
        to={`/user/service/${slug}`} 
        className={`${containerClasses} block cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-95`}
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

