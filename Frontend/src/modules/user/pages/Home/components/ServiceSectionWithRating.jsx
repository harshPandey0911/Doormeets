import React, { useRef, useState, useEffect } from 'react';
import ServiceWithRatingCard from '../../../components/common/ServiceWithRatingCard';

const ServiceSectionWithRating = React.memo(({ title, subtitle, services, onSeeAllClick, onServiceClick, onAddClick, compact = false }) => {
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const serviceList = services || [];

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [serviceList]);

  return (
    <div className="my-10 px-3 md:px-5 w-full">
      {/* Header row: title+subtitle on left, "See all" pill button on right */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-[28px] font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {onSeeAllClick && (
          <button
            onClick={onSeeAllClick}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 hover:border-[#B33A35] hover:text-[#B33A35] hover:bg-gray-50 transition-colors duration-200 shrink-0"
          >
            See all
          </button>
        )}
      </div>

      {/* Carousel Wrapper */}
      <div className="relative group/carousel">
        {showLeftArrow && (
          <button
            onClick={() => containerRef.current.scrollBy({ left: -240, behavior: 'smooth' })}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100 hover:bg-gray-50 hover:shadow-lg transition-all text-gray-700 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {showRightArrow && (
          <button
            onClick={() => containerRef.current.scrollBy({ left: 240, behavior: 'smooth' })}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100 hover:bg-gray-50 hover:shadow-lg transition-all text-gray-700 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        >
          {serviceList.map((service) => (
            <div key={service.id} className="snap-start shrink-0">
              <ServiceWithRatingCard
                title={service.title}
                rating={service.rating}
                reviews={service.reviews}
                price={service.price}
                originalPrice={service.originalPrice}
                discount={service.discount}
                image={service.image}
                compact={compact}
                slug={service.slug}
                onClick={() => onServiceClick?.(service)}
                onAddClick={() => onAddClick?.(service)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

ServiceSectionWithRating.displayName = 'ServiceSectionWithRating';

export default ServiceSectionWithRating;


