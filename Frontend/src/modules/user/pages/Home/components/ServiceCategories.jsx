import React from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicIcon from '../../../../../components/DynamicIcon';

const ServiceCategories = React.memo(({ 
  categories, 
  onCategoryClick, 
  title = "Categories",
  subtitle = "Premium Home Services"
}) => {
  const navigate = useNavigate();

  // Detect current theme
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  // Theme-aware color palettes for category tiles
  const cardColors = isDark ? [
    { bg: 'rgba(253, 230, 0, 0.08)',  border: 'rgba(253, 230, 0, 0.18)',  text: '#FDE68A' }, // Yellow/Gold
    { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.18)', text: '#C084FC' }, // Purple/Lavender
    { bg: 'rgba(244, 63, 94, 0.08)',  border: 'rgba(244, 63, 94, 0.18)',  text: '#FDA4AF' }, // Rose/Pink
    { bg: 'rgba(239, 68, 68, 0.08)',  border: 'rgba(239, 68, 68, 0.18)',  text: '#FCA5A5' }, // Soft Red
    { bg: 'rgba(34, 197, 94, 0.08)',  border: 'rgba(34, 197, 94, 0.18)',  text: '#86EFAC' }, // Green
    { bg: 'rgba(14, 165, 233, 0.08)', border: 'rgba(14, 165, 233, 0.18)', text: '#7DD3FC' }, // Light Blue
    { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.18)', text: '#A5B4FC' }, // Indigo
    { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.18)', text: '#FCD34D' }, // Amber/Warm
    { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.18)', text: '#93C5FD' }, // Royal Blue
  ] : [
    { bg: '#FEFBE8', border: '#FEF08A', text: '#854D0E' }, // Yellow/Gold
    { bg: '#FAE8FF', border: '#F5D0FE', text: '#86198F' }, // Purple/Lavender
    { bg: '#FFE4E6', border: '#FECDD3', text: '#9F1239' }, // Rose/Pink
    { bg: '#FFF1F2', border: '#FEE2E2', text: '#991B1B' }, // Soft Red
    { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' }, // Green
    { bg: '#E0F2FE', border: '#BAE6FD', text: '#075985' }, // Light Blue
    { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' }, // Indigo
    { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E' }, // Amber/Warm
    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' }, // Royal Blue
  ];

  const displayCategories = categories.map((cat, idx) => {
    const colorScheme = cardColors[idx % cardColors.length];
    return {
      ...cat,
      icon: cat.icon || cat.image,
      colorScheme
    };
  }); // Keep all categories without limiting to 9

  return (
    <div className="px-3 md:px-5 w-full">
      {/* Title Header with "See all" */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-[17px] font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
      </div>

      {/* Grid Layout of Rounded rectangular cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-3 lg:gap-5">
        {displayCategories.map((category, index) => {
          return (
            <div
              key={category.id || index}
              onClick={() => onCategoryClick?.(category)}
              className="flex flex-col items-center group cursor-pointer"
            >
              {/* Image card wrapper */}
              <div
                className="w-full aspect-square rounded-[20px] transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.01)] overflow-hidden relative active:scale-95 group-hover:scale-[1.01]"
                style={{
                  backgroundColor: category.colorScheme.bg,
                }}
              >
                {category.icon ? (
                  <DynamicIcon
                    icon={category.icon}
                    alt={category.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke={category.colorScheme.text} viewBox="0 0 24 24" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Title under the image card */}
              <span 
                className="mt-2 text-[10.5px] lg:text-xs font-normal tracking-tight text-center text-slate-700 dark:text-zinc-300 w-full line-clamp-2 leading-tight px-1 break-words"
              >
                {category.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

ServiceCategories.displayName = 'ServiceCategories';

export default ServiceCategories;
