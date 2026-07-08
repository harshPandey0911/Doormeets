import React, { memo } from 'react';
import { optimizeCloudinaryUrl } from '../../../../utils/cloudinaryOptimize';

const SimpleServiceCard = memo(({ image, title, onClick }) => {
  return (
    <div
      className="min-w-[160px] flex flex-col bg-surface rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-brand/5 hover:-translate-y-1.5 active:scale-98 border border-border/80 group"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {image ? (
          <img
            src={optimizeCloudinaryUrl(image, { width: 320, quality: 'auto' })}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-card-bg to-divider flex items-center justify-center">
            <svg
              className="w-10 h-10 text-muted-text opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3.5 flex items-center justify-center flex-1 text-center bg-surface">
        <h3 className="text-xs font-bold text-dark-text leading-snug line-clamp-1 group-hover:text-brand transition-colors">{title}</h3>
      </div>
    </div>
  );
});

SimpleServiceCard.displayName = 'SimpleServiceCard';

export default SimpleServiceCard;

