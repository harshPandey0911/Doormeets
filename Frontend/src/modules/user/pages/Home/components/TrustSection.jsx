import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TrustSection = ({ items = [] }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full px-3 md:px-5 mt-2 mb-6">
      {/* Single box containing all dynamic items stacked vertically */}
      <div 
        className="rounded-md p-4 shadow-sm border space-y-1 bg-white dark:bg-zinc-900"
        style={{ borderColor: 'var(--border)' }}
      >
        {items.map((item, index) => {
          const hasLongDescription = item.description && item.description.length > 80;
          return (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.05 
              }}
              onClick={() => hasLongDescription && setSelectedItem(item)}
              className={`flex items-start gap-3.5 py-3 first:pt-1 last:pb-1 ${index < items.length - 1 ? 'border-b border-border-color' : ''} ${hasLongDescription ? 'cursor-pointer group' : ''}`}
            >
              <div 
                className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center rounded-md text-base md:text-lg font-bold mt-0.5"
                style={{ 
                  background: `linear-gradient(135deg, ${item.color ? `${item.color}18` : 'rgba(79, 70, 229, 0.1)'}, ${item.color ? `${item.color}05` : 'rgba(79, 70, 229, 0.02)'})`,
                  color: item.color || '#4f46e5',
                  border: `1px solid ${item.color ? `${item.color}25` : 'rgba(79, 70, 229, 0.15)'}`
                }}
              >
                {item.icon || '✓'}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm md:text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </h4>
                
                {item.description && (
                  <p className="text-[11px] sm:text-xs md:text-sm leading-relaxed font-medium mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {item.description}
                  </p>
                )}

                {hasLongDescription && (
                  <span className="inline-flex items-center gap-0.5 text-[#B33A35] dark:text-red-400 text-[10px] md:text-xs font-bold mt-1 group-hover:underline">
                    Read more
                    <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Details Modal */}
      {createPortal(
        <AnimatePresence>
          {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[6px]">
              <motion.div 
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', duration: 0.45, bounce: 0.2 }}
                className="rounded-md p-7 max-w-sm w-full border shadow-2xl relative overflow-hidden"
                style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
              >
                {/* Top decorative gradient blur */}
                <div 
                  className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: selectedItem.color || '#4f46e5' }}
                />

                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-xs font-bold transition-all hover:rotate-90 duration-300"
                >
                  ✕
                </button>

                <div className="flex flex-col items-center text-center gap-4 mt-2 relative z-10">
                  <div 
                    className="w-14 h-14 flex items-center justify-center rounded-md text-xl font-bold shadow-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${selectedItem.color ? `${selectedItem.color}25` : 'rgba(79, 70, 229, 0.15)'}, ${selectedItem.color ? `${selectedItem.color}05` : 'rgba(79, 70, 229, 0.03)'})`,
                      color: selectedItem.color || '#4f46e5',
                      border: `1px solid ${selectedItem.color ? `${selectedItem.color}35` : 'rgba(79, 70, 229, 0.2)'}`
                    }}
                  >
                    {selectedItem.icon || '✓'}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-base md:text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {selectedItem.title}
                    </h3>
                  </div>

                  <div className="w-full border-t my-1" style={{ borderColor: 'var(--border)' }} />
                  
                  <p className="text-xs md:text-sm leading-relaxed max-h-[40vh] overflow-y-auto text-left w-full pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-850 scrollbar-track-transparent" style={{ color: 'var(--text-secondary)' }}>
                    {selectedItem.description}
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default TrustSection;
