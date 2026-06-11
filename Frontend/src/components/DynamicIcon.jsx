import React from 'react';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const DynamicIcon = ({ icon, alt = 'Icon', className = '' }) => {
  if (!icon) return null;

  const isSvg = typeof icon === 'string' && icon.trim().startsWith('<svg');

  if (isSvg) {
    // Inject the className into the SVG if it doesn't already have one, or just wrap it in a span with the className
    return (
      <span
        className={`inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full ${className}`}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  }

  return (
    <img
      src={toAssetUrl(icon)}
      alt={alt}
      className={className}
      onError={(e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
      }}
    />
  );
};

export default DynamicIcon;
