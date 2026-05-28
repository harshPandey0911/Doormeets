import React from 'react';
import CategoryCard from '../../../components/common/CategoryCard';

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
  title = "Service Categories",
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
      {/* Horizontal Scroll Layout on mobile, beautiful clean scrollbar-hidden layout */}
      <div className="flex items-start gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-5 px-5">
        {displayCategories.map((category, index) => {
          return (
            <div 
              key={category.id || index} 
              className="flex-shrink-0 snap-start"
              style={{ width: '76px' }}
            >
              <CategoryCard
                title={category.title}
                icon={
                  category.icon ? (
                    <img
                      src={category.icon}
                      alt={category.title}
                      className="w-12 h-12 object-contain group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-50/50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  )
                }
                onClick={() => onCategoryClick?.(category)}
                hasSaleBadge={category.hasSaleBadge}
                index={index}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

ServiceCategories.displayName = 'ServiceCategories';

export default ServiceCategories;

