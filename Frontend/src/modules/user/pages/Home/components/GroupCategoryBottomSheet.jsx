import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import DynamicIcon from '../../../../../components/DynamicIcon';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

/**
 * GroupCategoryBottomSheet
 * Urban Company-style bottom sheet showing mapped sub-categories when a group category is tapped.
 */
const GroupCategoryBottomSheet = ({ isOpen, onClose, category, onCategoryClick }) => {
  const sheetRef = useRef(null);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!category) return null;

  const mappedCategories = category.mappedCategories || [];

  // Consistent color palette for child category tiles
  const tileColors = [
    { bg: '#FEFBE8', border: '#FEF08A', text: '#854D0E' },
    { bg: '#FAE8FF', border: '#F5D0FE', text: '#86198F' },
    { bg: '#FFE4E6', border: '#FECDD3', text: '#9F1239' },
    { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' },
    { bg: '#E0F2FE', border: '#BAE6FD', text: '#075985' },
    { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3' },
    { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E' },
    { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
    { bg: '#FFF1F2', border: '#FEE2E2', text: '#991B1B' },
  ];

  return createPortal(
    <>
      {/* Backdrop (now purely visual, click-to-close handled by modal wrapper) */}
      <div
        className="fixed inset-0 transition-all duration-300"
        style={{
          zIndex: 99998,
          backgroundColor: isOpen ? 'rgba(0,0,0,0.5)' : 'transparent',
          pointerEvents: isOpen ? 'auto' : 'none',
          backdropFilter: isOpen ? 'blur(2px)' : 'none',
        }}
      />

      {/* Centered Modal Container */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{
          zIndex: 99999,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={handleBackdropClick}
      >
      <div
        ref={sheetRef}
        className="rounded-md shadow-2xl w-full max-w-xl transition-all duration-300"
        style={{
          backgroundColor: 'var(--background, #ffffff)',
          transform: isOpen ? 'scale(1)' : 'scale(0.92)',
          opacity: isOpen ? 1 : 0,
          height: 'fit-content',
          maxHeight: '85vh',
          overflowY: 'auto',
          paddingBottom: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 pt-1">
          <div className="flex items-center gap-3">
            {category.icon && (
              <div
                className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border"
                style={{ borderColor: 'var(--border, #E5E7EB)' }}
              >
                <DynamicIcon
                  icon={toAssetUrl(category.icon)}
                  alt={category.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h3
                className="text-[17px] font-bold"
                style={{ color: 'var(--text-primary, #111827)' }}
              >
                {category.title}
              </h3>
              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--text-secondary, #6B7280)' }}
              >
                {mappedCategories.length} service{mappedCategories.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: 'var(--surface, #F3F4F6)',
              color: 'var(--text-secondary, #6B7280)'
            }}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-4 h-px" style={{ backgroundColor: 'var(--border, #F3F4F6)' }} />

        {/* Mapped Category Grid */}
        <div className="px-5 pb-8">
          {mappedCategories.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">No services configured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {mappedCategories.map((mc, idx) => {
                const color = tileColors[idx % tileColors.length];
                return (
                  <div
                    key={mc.id || mc.slug || idx}
                    onClick={() => {
                      onClose();
                      onCategoryClick?.(mc);
                    }}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-all duration-200 group w-full"
                  >
                    {/* Card Image/Icon container */}
                    <div 
                      className="w-full aspect-square rounded-md overflow-hidden relative shadow-sm border border-gray-100 dark:border-zinc-800/80 group-hover:scale-[1.02] transition-transform duration-200 flex items-center justify-center"
                      style={{
                        backgroundColor: mc.icon ? 'transparent' : color.bg,
                        borderColor: mc.icon ? 'var(--border, #E5E7EB)' : color.border,
                      }}
                    >
                      {mc.icon ? (
                        <DynamicIcon
                          icon={toAssetUrl(mc.icon)}
                          alt={mc.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold"
                          style={{ backgroundColor: color.border, color: color.text }}
                        >
                          {mc.title?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    {/* Text Label Below Card */}
                    <span
                      className="text-[11px] font-medium text-center leading-snug line-clamp-2 w-full px-1"
                      style={{ color: 'var(--text-primary, #111827)' }}
                    >
                      {mc.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </>,
    document.body
  );
};

export default GroupCategoryBottomSheet;
