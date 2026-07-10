import React, { memo, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { AiFillStar } from 'react-icons/ai';
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

  useEffect(() => {
    if (cardRef.current) {
      const card = cardRef.current;

      const handleMouseEnter = () => {
        gsap.to(card, {
          y: -4,
          scale: 1.01,
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const handleMouseLeave = () => {
        gsap.to(card, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const handleClick = () => {
        gsap.to(card, {
          scale: 0.98,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out',
        });
      };

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
      card.addEventListener('click', handleClick);

      return () => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
        card.removeEventListener('click', handleClick);
      };
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className="w-[140px] min-w-[140px] md:w-[200px] md:min-w-[200px] flex flex-col cursor-pointer group transition-all duration-300"
      onClick={onClick}
    >
      <div className="w-full aspect-square rounded-[20px] bg-gray-50 overflow-hidden relative mb-2">
        {discount && isPriceDisclosed && (
          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold rounded-md px-2 py-0.5 z-10">
            {discount.toString().toUpperCase().includes('OFF') ? discount : `${discount}% OFF`}
          </div>
        )}
        {image ? (
          <img
            src={optimizeCloudinaryUrl(image, { width: 400, quality: 'auto' })}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span style={{ color: '#1A1A1A' }} className="text-xs font-medium">No Image</span>
          </div>
        )}
      </div>
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

        {(title?.toLowerCase().includes('ac') || title?.toLowerCase().includes('instant')) && (
          <div className="text-green-600 text-xs font-medium mb-1 flex items-center gap-1">
            <span>⚡ Instant</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 mt-auto">
          {isPriceDisclosed ? (
            <>
              {displayOriginalPrice && (
                <span className="text-[12px] text-gray-400 line-through">₹{displayOriginalPrice}</span>
              )}
              <span className="text-[15px] font-bold text-[#1A1A1A]">₹{displayPrice}</span>
            </>
          ) : (
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">Not Disclosed</span>
          )}
        </div>
      </div>
    </div >
  );
});

DetailedServiceCard.displayName = 'DetailedServiceCard';

export default DetailedServiceCard;


