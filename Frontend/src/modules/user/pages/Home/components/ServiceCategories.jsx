import React, { useRef, useState, useEffect, useMemo } from 'react';
import ScrollArrowButton from '../../../components/common/ScrollArrowButton';
import { useNavigate } from 'react-router-dom';
import DynamicIcon from '../../../../../components/DynamicIcon';

const ServiceCategories = React.memo(({
  categories,
  onCategoryClick,
  title = "Categories",
  showSeeAll = true,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(categories && categories.length > 5);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  const cardColors = isDark ? [
    { bg: 'rgba(253, 230, 0, 0.08)', text: '#FDE68A' },
    { bg: 'rgba(168, 85, 247, 0.08)', text: '#C084FC' },
    { bg: 'rgba(244, 63, 94, 0.08)', text: '#FDA4AF' },
    { bg: 'rgba(239, 68, 68, 0.08)', text: '#FCA5A5' },
    { bg: 'rgba(34, 197, 94, 0.08)', text: '#86EFAC' },
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
  }, [categories]);

  const scrollByOneCard = (direction) => {
    if (containerRef.current && containerRef.current.children.length > 0) {
      const cardWidth = containerRef.current.children[0].offsetWidth;
      const gap = 12;
      containerRef.current.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
    }
  };

  return (
    <div className="px-3 md:px-5 w-full">
      {/* Title + Inline See All Button */}
      <div className="flex items-center gap-3 mb-4">
        <h2
          className="text-[15.5px] md:text-[22px] font-medium md:font-extrabold tracking-tight leading-[1.2]"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
        {showSeeAll && (
          <button
            onClick={() => navigate('/user/categories')}
            className="text-[13px] font-semibold text-[#B33A35] hover:opacity-80 transition-opacity flex items-center gap-0.5"
          >
            See all
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Grid Layout */}
      <div className="relative" style={{ overflow: 'visible' }}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-3 gap-y-5 pb-2">
          {displayCategories.map((category, index) => (
            <div
              key={category.id || index}
              onClick={() => onCategoryClick?.(category)}
              className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-all duration-200 group w-full"
            >
              {/* Image card */}
              <div
                className="w-full aspect-square rounded-md overflow-hidden relative shadow-[0_2px_8px_rgba(0,0,0,0.06)] group-hover:scale-[1.02] transition-transform duration-200 category-image-card"
                style={{ backgroundColor: category.colorScheme.bg }}
              >
                {category.icon ? (
                  <DynamicIcon
                    icon={category.icon}
                    alt={category.title}
                    className="w-full h-full object-cover contrast-[1.02] brightness-[1.01]"
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
                className="text-[11px] font-medium text-center leading-snug line-clamp-2 w-full px-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {category.title}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .category-image-card img {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div >
  );
});

ServiceCategories.displayName = 'ServiceCategories';

export default ServiceCategories;
