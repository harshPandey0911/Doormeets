import React, { useEffect, useRef } from 'react';
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

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 transition-all duration-300"
        style={{
          zIndex: 99998,
          backgroundColor: isOpen ? 'rgba(0,0,0,0.5)' : 'transparent',
          pointerEvents: isOpen ? 'auto' : 'none',
          backdropFilter: isOpen ? 'blur(2px)' : 'none',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl transition-transform duration-500 ease-out"
        style={{
          zIndex: 99999,
          backgroundColor: 'var(--background, #ffffff)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '85vh',
          overflowY: 'auto',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 16px))',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-4 pb-2">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: 'var(--border, #E5E7EB)' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4 pt-1">
          <div className="flex items-center gap-3">
            {category.icon && (
              <div
                className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border"
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
                    className="relative flex flex-col items-center justify-center p-3 rounded-2xl cursor-pointer active:scale-95 hover:scale-[1.02] transition-all duration-200 border text-center aspect-square shadow-sm overflow-hidden"
                    style={{
                      backgroundColor: mc.icon ? 'transparent' : color.bg,
                      borderColor: mc.icon ? 'transparent' : color.border,
                    }}
                  >
                    {mc.icon ? (
                      <>
                        <div className="absolute inset-0 w-full h-full">
                          <DynamicIcon
                            icon={toAssetUrl(mc.icon)}
                            alt={mc.title}
                            className="w-full h-full object-cover transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                        </div>
                        <span className="absolute bottom-2 left-0 right-0 px-2 text-[11px] font-bold tracking-tight text-white z-10 leading-tight">
                          {mc.title}
                        </span>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center mb-2 text-lg font-bold"
                          style={{ backgroundColor: color.border, color: color.text }}
                        >
                          {mc.title?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span
                          className="text-[11px] font-semibold leading-tight w-full truncate"
                          style={{ color: '#1F2937' }}
                        >
                          {mc.title}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GroupCategoryBottomSheet;
