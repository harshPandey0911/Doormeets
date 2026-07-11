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
        <h2 className="text-[22px] font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
          {title || "Most booked services"}
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
      <div className="relative group" style={{ overflow: 'visible' }}>
        {showLeftArrow && (
          <ScrollArrowButton
            direction="left"
            onClick={() => scrollByOneCard(-1)}
            className="left-0 md:-left-4 top-1/3 -translate-y-1/2"
          />
        )}
        
        {showRightArrow && (
          <ScrollArrowButton
            direction="right"
            onClick={() => scrollByOneCard(1)}
            className="right-0 md:-right-4 top-1/3 -translate-y-1/2"
          />
        )}

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4 pr-8 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        >
          {serviceList.map((service, index) => (
            <div key={service.id || index} className="snap-start shrink-0">
              <DetailedServiceCard
                title={service.title}
                rating={service.rating}
                reviews={service.reviews}
                price={service.price}
                originalPrice={service.originalPrice}
                discount={service.discount}
                isPriceDisclosed={service.isPriceDisclosed}
                image={service.image}
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

MostBookedServices.displayName = 'MostBookedServices';

export default MostBookedServices;


