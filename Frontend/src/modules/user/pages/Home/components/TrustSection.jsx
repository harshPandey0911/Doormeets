import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TrustSection = ({ items = [] }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  if (!items || items.length === 0) return null;

  return (
    <div className="w-full px-3 md:px-5 mt-2 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="flex flex-col items-center text-center gap-3 p-4 md:p-5 rounded-[20px] border border-gray-100 dark:border-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.05)] transition-all duration-300 bg-white dark:bg-zinc-900 w-full"
          >
            <div 
              className="w-10 h-10 md:w-11 md:h-11 shrink-0 flex items-center justify-center rounded-xl md:rounded-2xl text-base md:text-lg font-bold"
              style={{ 
                backgroundColor: item.color ? `${item.color}15` : '#e0e7ff',
                color: item.color || '#4f46e5'
              }}
            >
              {item.icon || '✓'}
            </div>
            <div className="flex flex-col items-center min-w-0 w-full flex-1">
              <span className="text-[12px] md:text-[14px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                {item.title}
              </span>
              {item.description && (
                <div className="flex flex-col items-center mt-1 w-full">
                  <span className="text-[10px] md:text-[11px] text-gray-500 dark:text-zinc-400 leading-snug line-clamp-3 w-full">
                    {item.description}
                  </span>
                  {item.description.length > 60 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                      className="text-[#B33A35] hover:text-[#902A26] text-[9.5px] md:text-[10.5px] font-bold mt-1.5 hover:underline"
                    >
                      Read more
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 max-w-sm w-full border border-gray-100 dark:border-zinc-800 shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 text-xs font-bold transition-colors"
              >
                ✕
              </button>
              <div className="flex flex-col items-center text-center gap-3.5 mt-2">
                <div 
                  className="w-12 h-12 flex items-center justify-center rounded-2xl text-lg font-bold"
                  style={{ 
                    backgroundColor: selectedItem.color ? `${selectedItem.color}15` : '#e0e7ff',
                    color: selectedItem.color || '#4f46e5'
                  }}
                >
                  {selectedItem.icon || '✓'}
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {selectedItem.title}
                </h3>
                <div className="w-full border-t border-gray-100 dark:border-zinc-800 my-1" />
                <p className="text-xs md:text-sm text-gray-600 dark:text-zinc-300 leading-relaxed max-h-[50vh] overflow-y-auto text-left w-full pr-1 scrollbar-thin">
                  {selectedItem.description}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TrustSection;
