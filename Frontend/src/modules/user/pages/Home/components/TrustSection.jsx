import React from 'react';
import { motion } from 'framer-motion';

const TrustSection = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full px-3 md:px-5 mt-2 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {items.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="flex flex-row items-center text-left gap-2 p-2.5 rounded-xl border border-gray-100 shadow-sm bg-white w-full"
          >
            <div 
              className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-opacity-10 text-[10px]"
              style={{ 
                backgroundColor: item.color ? `${item.color}20` : '#e0e7ff',
                color: item.color || '#4f46e5'
              }}
            >
              {item.icon || '✓'}
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-[10px] font-bold text-gray-800 tracking-tight leading-tight line-clamp-2">
                {item.title}
              </span>
              {item.description && (
                <span className="text-[9px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                  {item.description}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrustSection;
