import React, { useRef, useState, useEffect } from 'react';
import DynamicIcon from '../../../../../components/DynamicIcon';

const ServiceCategories = React.memo(({ 
  categories, 
  onCategoryClick, 
  title = "Categories",
}) => {
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  const cardColors = isDark ? [
    { bg: 'rgba(253, 230, 0, 0.08)',  text: '#FDE68A' },
    { bg: 'rgba(168, 85, 247, 0.08)', text: '#C084FC' },
    { bg: 'rgba(244, 63, 94, 0.08)',  text: '#FDA4AF' },
    { bg: 'rgba(239, 68, 68, 0.08)',  text: '#FCA5A5' },
    { bg: 'rgba(34, 197, 94, 0.08)',  text: '#86EFAC' },
    { bg: 'rgba(14, 165, 233, 0.08)', text: '#7DD3FC' },
    { bg: 'rgba(99, 102, 241, 0.08)', text: '#A5B4FC' },
    { bg: 'rgba(245, 158, 11, 0.08)', text: '#FCD34D' },
    { bg: 'rgba(59, 130, 246, 0.08)', text: '#93C5FD' },
  ] : [
    { bg: '#FEFBE8', text: '#854D0E' },
    { bg: '#FAE8FF', text: '#86198F' },
    { bg: '#FFE4E6', text: '#9F1239' },
    { bg: '#FFF1F2', text: '#991B1B' },
    { bg: '#F0FDF4', text: '#166534' },
    { bg: '#E0F2FE', text: '#075985' },
    { bg: '#EEF2FF', text: '#3730A3' },
    { bg: '#FEF3C7', text: '#92400E' },
    { bg: '#EFF6FF', text: '#1E40AF' },
  ];

  const displayCategories = categories.map((cat, idx) => ({
    ...cat,
    icon: cat.icon || cat.image,
    colorScheme: cardColors[idx % cardColors.length],
  }));

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
  }, [categories]);

  return (
    <div className="px-3 md:px-5 w-full">
      {/* Title */}
      <div className="flex items-center mb-4">
        <h2
          className="text-[17px] font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
      </div>

      {/* Horizontal scroll carousel with arrow buttons */}
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => containerRef.current.scrollBy({ left: -300, behavior: 'smooth' })}
            className="absolute -left-4 top-[40%] -translate-y-1/2 z-20 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:shadow-xl transition-all text-gray-700 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => containerRef.current.scrollBy({ left: 300, behavior: 'smooth' })}
            className="absolute -right-4 top-[40%] -translate-y-1/2 z-20 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:shadow-xl transition-all text-gray-700 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Scrollable Row */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth"
        >
          {displayCategories.map((category, index) => (
            <div
              key={category.id || index}
              onClick={() => onCategoryClick?.(category)}
              className="snap-start shrink-0 flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-all duration-200 group"
              style={{ width: '110px' }}
            >
              {/* Image card */}
              <div
                className="w-full aspect-square rounded-[20px] overflow-hidden relative shadow-[0_2px_8px_rgba(0,0,0,0.06)] group-hover:scale-[1.02] transition-transform duration-200"
                style={{ backgroundColor: category.colorScheme.bg }}
              >
                {category.icon ? (
                  <DynamicIcon
                    icon={category.icon}
                    alt={category.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke={category.colorScheme.text} viewBox="0 0 24 24" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Name below image */}
              <span
                className="text-[11px] font-semibold text-center leading-snug line-clamp-2 w-full px-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {category.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

ServiceCategories.displayName = 'ServiceCategories';

export default ServiceCategories;
