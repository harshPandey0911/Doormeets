import React from 'react';
import { motion } from 'framer-motion';

const TrustSection = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full px-4 mt-2 mb-6">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {items.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl shrink-0 border border-gray-100 shadow-sm bg-white"
          >
            <div 
              className="w-6 h-6 flex items-center justify-center rounded-full bg-opacity-10 text-sm"
              style={{ 
                backgroundColor: item.color ? `${item.color}20` : '#e0e7ff',
                color: item.color || '#4f46e5'
              }}
            >
              {item.icon || '✓'}
            </div>
            <span className="text-xs font-bold text-gray-800 whitespace-nowrap tracking-tight">
              {item.title}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrustSection;
