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
    <div className="px-5 w-full">
      {/* Title Header with "See all" */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[17px] font-extrabold tracking-tight text-dark-text">{title}</h2>
          {subtitle && (
            <p className="text-xs font-semibold text-muted-text mt-0.5">{subtitle}</p>
          )}
        </div>
        <button
          onClick={() => navigate('/user/categories')}
          className="text-xs font-black text-brand transition-colors hover:text-brand-light cursor-pointer"
        >
          See all
        </button>
      </div>

      {/* Grid Layout of Rounded rectangular cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4">
        {displayCategories.map((category, index) => {
          return (
            <div
              key={category.id || index}
              onClick={() => onCategoryClick?.(category)}
              className="group flex flex-col items-center cursor-pointer transition-all duration-300"
            >
              {/* Image Card Container */}
              <div className="w-full aspect-square rounded-[24px] overflow-hidden bg-white border border-border shadow-[0_8px_30px_rgba(0,0,0,0.02)] group-hover:shadow-[0_20px_40px_rgba(255,107,74,0.08)] group-hover:border-brand/20 group-hover:-translate-y-1 active:scale-98 transition-all duration-300 flex items-center justify-center mb-2.5">
                {category.icon ? (
                  <DynamicIcon
                    icon={category.icon}
                    alt={category.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                  />
                ) : (
                  <div className="w-full h-full bg-brand/5 flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Text Label Outside */}
              <span className="text-[12px] font-black tracking-tight text-slate-800 group-hover:text-brand transition-colors text-center truncate w-full px-1">
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
