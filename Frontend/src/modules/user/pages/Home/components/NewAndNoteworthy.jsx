import React, { useRef, useState, useEffect } from 'react';
import DetailedServiceCard from '../../../components/common/DetailedServiceCard';
import ScrollArrowButton from '../../../components/common/ScrollArrowButton';
import SimpleServiceCard from '../../../components/common/SimpleServiceCard';

const NewAndNoteworthy = React.memo(({ services, onServiceClick, onSeeAllClick, title, subtitle }) => {
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
    <div className="my-3 md:my-6 px-3 md:px-5 w-full">
      {/* Header */}
      <div className="mb-2.5 md:mb-4 flex items-center gap-3">
        <h2 className="text-[15.5px] md:text-[22px] font-medium md:font-extrabold tracking-tight leading-[1.2]" style={{ color: 'var(--text-primary)' }}>
          {title || "New & Noteworthy"}
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
          className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 pr-6 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        >
          {serviceList.map((service, index) => {
            const hasLightningBadge = service.title?.toLowerCase().includes('ac') || 
                                       service.title?.toLowerCase().includes('purifier') || 
                                       service.title?.toLowerCase().includes('cleaning');
            return (
              <div 
                key={service.id || index} 
                onClick={() => onServiceClick?.(service)}
                className="snap-start shrink-0 w-[124px] xs:w-[136px] sm:w-[155px] md:w-[220px] cursor-pointer flex flex-col group transition-all duration-300 active:scale-95 text-left"
              >
                {/* Image Box */}
                <div className="w-full aspect-square rounded-md bg-gray-50 dark:bg-zinc-900 border overflow-hidden relative shadow-[0_2px_12px_rgba(0,0,0,0.02)] group-hover:scale-[1.01] transition-transform duration-200" style={{ borderColor: 'var(--border)' }}>
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
                {/* Title */}
                <h3 className="mt-3 text-[13px] md:text-[15.5px] font-medium md:font-semibold leading-snug line-clamp-2 px-1" style={{ color: 'var(--text-primary)' }}>
                  {service.title}
                </h3>
                {/* Conditional Lightning Badge */}
                {hasLightningBadge && (
                  <span className="text-green-600 text-[11px] md:text-[12px] font-semibold mt-1 px-1 flex items-center gap-0.5">
                    ⚡ In 47 mins
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

NewAndNoteworthy.displayName = 'NewAndNoteworthy';

export default NewAndNoteworthy;


