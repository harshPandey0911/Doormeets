import React, { memo } from 'react';
import { optimizeCloudinaryUrl } from '../../../../utils/cloudinaryOptimize';

const SimpleServiceCard = memo(({ image, title, onClick }) => {
  return (
    <div
      className="w-[110px] min-w-[110px] cursor-pointer flex flex-col group transition-all duration-300 active:scale-95"
      onClick={onClick}
    >
      <div className="w-full aspect-square rounded-[20px] bg-gray-100 overflow-hidden relative shadow-[0_2px_8px_rgba(0,0,0,0.06)] group-hover:scale-[1.02] transition-transform duration-200">
        {image ? (
          <img
            src={optimizeCloudinaryUrl(image, { width: 320, quality: 'auto' })}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
      <h3 className="mt-2 text-[11px] font-medium leading-snug line-clamp-2 px-0.5" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
    </div>
  );
});

SimpleServiceCard.displayName = 'SimpleServiceCard';

export default SimpleServiceCard;


