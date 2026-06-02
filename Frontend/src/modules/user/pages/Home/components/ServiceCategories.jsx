import React from 'react';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

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
    icon: toAssetUrl(cat.icon || cat.image),
  }));

  return (
    <div className="px-5 w-full">
      {/* Title Header */}
      <div className="mb-4">
        <h2 className="text-base font-extrabold text-[#111827] tracking-tight">
          {title}
        </h2>
      </div>

      {/* Grid Layout - 3 columns, matching the first image */}
      <div className="grid grid-cols-3 gap-3">
        {displayCategories.map((category, index) => {
          return (
            <div
              key={category.id || index}
              onClick={() => onCategoryClick?.(category)}
              className="bg-white border border-gray-100/70 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center shadow-[0_4px_12px_rgba(0,0,0,0.015)] aspect-square active:scale-95 transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-200"
            >
              {category.icon ? (
                <img
                  src={category.icon}
                  alt={category.title}
                  className="w-10 h-10 object-contain mb-2 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-blue-50/50 rounded-xl mb-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              )}
              <span className="text-[11px] font-bold text-[#374151] tracking-tight line-clamp-1 w-full mt-1">
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
