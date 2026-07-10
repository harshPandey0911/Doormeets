import React, { useRef, useState, useEffect } from 'react';
import ServiceWithRatingCard from '../../../components/common/ServiceWithRatingCard';

const ServiceSectionWithRating = React.memo(({ title, subtitle, services, onSeeAllClick, onServiceClick, onAddClick, compact = false }) => {
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(services && services.length > 5);

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
    
    const timer1 = setTimeout(handleScroll, 100);
    const timer2 = setTimeout(handleScroll, 600);

    window.addEventListener('resize', handleScroll);
    
    let observer;
    if (containerRef.current) {
      observer = new MutationObserver(handleScroll);
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleScroll);
      if (observer) observer.disconnect();
    };
  }, [serviceList]);

  return (
    <div className="my-10 px-3 md:px-5 w-full">
      {/* Header row: title + "See all" inline on same line */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-[22px] font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
          {title}
        </h2>
        {onSeeAllClick && (
          <button
            onClick={onSeeAllClick}
            className="text-[13px] font-semibold text-[#B33A35] hover:underline shrink-0"
          >
            See all
          </button>
        )}
      </div>

      {/* Carousel Wrapper */}
      <div className="relative" style={{ overflow: 'visible' }}>
        {showLeftArrow && (
          <button
            onClick={() => containerRef.current.scrollBy({ left: -300, behavior: 'smooth' })}
            className="absolute -left-4 top-1/3 -translate-y-1/2 z-20 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:shadow-xl transition-all text-gray-700 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {showRightArrow && (
          <button
            onClick={() => containerRef.current.scrollBy({ left: 300, behavior: 'smooth' })}
            className="absolute -right-4 top-1/3 -translate-y-1/2 z-20 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:shadow-xl transition-all text-gray-700 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4 pr-8 scrollbar-hide snap-x snap-mandatory scroll-smooth"
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


