import React, { useRef, useState, useEffect } from 'react';
import DetailedServiceCard from '../../../components/common/DetailedServiceCard';
import ScrollArrowButton from '../../../components/common/ScrollArrowButton';

const MostBookedServices = React.memo(({ services, onServiceClick, onAddClick, onSeeAllClick, title, subtitle }) => {
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const serviceList = services || [];

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
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

  if (serviceList.length === 0) {
    return null;
  }

  const scrollByOneCard = (direction) => {
    if (containerRef.current && containerRef.current.children.length > 0) {
      const cardWidth = containerRef.current.children[0].offsetWidth;
      const gap = 16;
      containerRef.current.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
    }
  };

  return (
    <div className="my-10 px-3 md:px-5 w-full">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-[15.5px] md:text-[22px] font-medium md:font-extrabold tracking-tight leading-[1.2]" style={{ color: 'var(--text-primary)' }}>
          {title || "Most booked services"}
        </h2>
      </div>

      {/* Carousel Wrapper */}
      <div className="relative group" style={{ overflow: 'visible' }}>
        {showLeftArrow && (
          <ScrollArrowButton
            direction="left"
            onClick={() => scrollByOneCard(-1)}
            className="left-0 md:-left-4 top-[35%] -translate-y-1/2"
          />
        )}
        
        {showRightArrow && (
          <ScrollArrowButton
            direction="right"
            onClick={() => scrollByOneCard(1)}
            className="right-0 md:-right-4 top-[35%] -translate-y-1/2"
          />
        )}

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4 pr-8 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        >
          {serviceList.map((service, index) => {
            const hasInstantBadge = service.title?.toLowerCase().includes('ac') || 
                                    service.title?.toLowerCase().includes('repair') || 
                                    service.title?.toLowerCase().includes('waxing');
            const displayPrice = service.price && !isNaN(service.price.toString().replace(/[,]/g, ''))
              ? `₹${service.price}`
              : service.price || 'Contact for price';
            return (
              <div 
                key={service.id || index} 
                onClick={() => onServiceClick?.(service)}
                className="snap-start shrink-0 w-[150px] md:w-[220px] cursor-pointer flex flex-col group transition-all duration-300 active:scale-95 text-left"
              >
                {/* Image Box */}
                <div className="w-full aspect-square rounded-[24px] bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 overflow-hidden relative shadow-[0_2px_12px_rgba(0,0,0,0.02)] group-hover:scale-[1.01] transition-transform duration-200">
                  {service.discount && (
                    <div className="absolute top-0 left-0 bg-[#0F8A5F] text-white text-[9px] md:text-[10px] font-bold px-2.5 py-1 rounded-br-[12px] z-10">
                      {service.discount.toString().toUpperCase().includes('OFF') ? service.discount : `${service.discount}% OFF`}
                    </div>
                  )}
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
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

                {/* Details */}
                <h3 className="mt-3 text-[13px] md:text-[15.5px] font-medium md:font-semibold leading-snug line-clamp-1 px-1" style={{ color: 'var(--text-primary)' }}>
                  {service.title}
                </h3>

                {/* Rating + Instant Badge */}
                {service.rating && (
                  <div className="flex items-center gap-1.5 mt-1 px-1 text-[11px] md:text-[12px] text-gray-500 font-medium">
                    <span className="text-yellow-500">★</span>
                    <span className="font-bold text-gray-700 dark:text-zinc-350">{service.rating}</span>
                    {hasInstantBadge && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-gray-500 flex items-center gap-0.5">
                          <span className="text-blue-500">⚡</span> Instant
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Price Row */}
                <div className="flex items-baseline gap-2 mt-1.5 px-1">
                  <span className="text-[13px] md:text-[15px] font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    {displayPrice}
                  </span>
                  {service.originalPrice && (
                    <span className="text-[11px] md:text-[13px] text-gray-400 line-through">
                      ₹{service.originalPrice}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

MostBookedServices.displayName = 'MostBookedServices';

export default MostBookedServices;


