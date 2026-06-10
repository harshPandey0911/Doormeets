import React from 'react';

import DynamicIcon from '../../../../../components/DynamicIcon';

const ServiceCategories = React.memo(({ 
  categories, 
  onCategoryClick, 
  title = "Categories",
  subtitle = "Premium Home Services"
}) => {
  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  const displayCategories = categories.map(cat => ({
    ...cat,
    icon: cat.icon || cat.image,
  }));

  return (
    <div className="px-5 w-full">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Title Header */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-[#111827] tracking-tight">
          {title}
        </h2>
      </div>

      {/* Horizontal Scroll Layout - Circular design */}
      <div 
        className="flex gap-5 overflow-x-auto pb-3 -mx-5 px-5 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayCategories.map((category, index) => {
          return (
            <div
              key={category.id || index}
              onClick={() => onCategoryClick?.(category)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer active:scale-95 transition-all duration-200 w-16"
            >
              {category.icon ? (
                <div className="w-16 h-16 rounded-full bg-white border border-gray-100/80 flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 overflow-hidden">
                  <DynamicIcon
                    icon={category.icon}
                    alt={category.title}
                    className="w-9 h-9 object-contain transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-50/50 border border-gray-100 flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              )}
              <span className="text-[11px] font-semibold text-gray-700 text-center tracking-tight truncate w-full mt-2">
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
