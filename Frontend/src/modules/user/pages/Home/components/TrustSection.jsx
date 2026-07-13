import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TrustSection = ({ items = [] }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full px-3 md:px-5 mt-2 mb-6">
      {/* Mobile: horizontal scroll | md+: grid */}
      <div className="flex md:grid md:grid-cols-4 gap-2.5 md:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide scroll-smooth pb-1 md:pb-0">
        {items.map((item, index) => {
          const hasLongDescription = item.description && item.description.length > 60;
          return (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5, scale: 1.01 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: index * 0.08 
              }}
              onClick={() => hasLongDescription && setSelectedItem(item)}
              className={`group flex flex-col items-center text-center gap-2 md:gap-4 p-3.5 md:p-6 rounded-[18px] md:rounded-[24px] border border-gray-100/90 dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.035)] transition-shadow duration-300 bg-white dark:bg-zinc-900 w-[150px] shrink-0 md:w-full md:shrink md:h-full ${hasLongDescription ? 'cursor-pointer' : ''}`}
            >
              <div 
                className="w-9 h-9 md:w-11 md:h-11 shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl text-sm md:text-lg font-bold transition-transform duration-300 group-hover:scale-110"
                style={{ 
                  background: `linear-gradient(135deg, ${item.color ? `${item.color}18` : 'rgba(79, 70, 229, 0.1)'}, ${item.color ? `${item.color}05` : 'rgba(79, 70, 229, 0.02)'})`,
                  color: item.color || '#4f46e5',
                  border: `1px solid ${item.color ? `${item.color}25` : 'rgba(79, 70, 229, 0.15)'}`
                }}
              >
                {item.icon || '✓'}
              </div>
              
              <div className="flex flex-col items-center min-w-0 w-full flex-1">
                <span className="text-[11.5px] md:text-[14px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-snug">
                  {item.title}
                </span>
                
                {item.description && (
                  <div className="flex flex-col items-center mt-1 w-full">
                    <span className="text-[9.5px] md:text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed line-clamp-3 w-full font-medium">
                      {item.description}
                    </span>
                    
                    {hasLongDescription && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[#B33A35] dark:text-red-400 text-[9.5px] md:text-[10.5px] font-extrabold mt-1.5 hover:underline transition-all"
                      >
                        Read more
                        <svg className="w-2.5 h-2.5 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </div>
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
                className="bg-white dark:bg-zinc-900 rounded-[32px] p-7 max-w-sm w-full border border-gray-100 dark:border-zinc-800/80 shadow-2xl relative overflow-hidden"
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
                    className="w-14 h-14 flex items-center justify-center rounded-2xl text-xl font-bold shadow-sm"
                    style={{ 
                      background: `linear-gradient(135deg, ${selectedItem.color ? `${selectedItem.color}25` : 'rgba(79, 70, 229, 0.15)'}, ${selectedItem.color ? `${selectedItem.color}05` : 'rgba(79, 70, 229, 0.03)'})`,
                      color: selectedItem.color || '#4f46e5',
                      border: `1px solid ${selectedItem.color ? `${selectedItem.color}35` : 'rgba(79, 70, 229, 0.2)'}`
                    }}
                  >
                    {selectedItem.icon || '✓'}
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-base md:text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                      {selectedItem.title}
                    </h3>
                  </div>

                  <div className="w-full border-t border-gray-100 dark:border-zinc-800/80 my-1" />
                  
                  <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed max-h-[40vh] overflow-y-auto text-left w-full pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
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
