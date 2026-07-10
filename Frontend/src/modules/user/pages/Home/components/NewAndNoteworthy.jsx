import React, { useRef, useState, useEffect } from 'react';
import SimpleServiceCard from '../../../components/common/SimpleServiceCard';

const NewAndNoteworthy = React.memo(({ services, onServiceClick, title, subtitle }) => {
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
    // Re-check scroll bounds when window resizes
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [serviceList]);

  if (serviceList.length === 0) {
    return null;
  }

  return (
    <div className="my-10 px-3 md:px-5 w-full">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-[22px] font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
          {title || "New and noteworthy"}
        </h2>
      </div>

      {/* Carousel Wrapper */}
      <div className="relative">
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
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        >
          {serviceList.map((service, index) => (
            <div key={service.id || index} className="snap-start shrink-0">
              <SimpleServiceCard
                title={service.title}
                image={service.image}
                onClick={() => onServiceClick?.(service)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

NewAndNoteworthy.displayName = 'NewAndNoteworthy';

export default NewAndNoteworthy;


