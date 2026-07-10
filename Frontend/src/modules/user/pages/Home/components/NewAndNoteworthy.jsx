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
      {/* Clean section header */}
      <div className="mb-6">
        <h2 className="text-[28px] font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
          {title || "New and noteworthy"}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {subtitle || "Explore our latest launches and trends"}
        </p>
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


