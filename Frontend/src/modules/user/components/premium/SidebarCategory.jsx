import React from 'react';
import { motion } from 'framer-motion';

const SidebarCategory = ({ category, active = false, onClick }) => {
  const isComingSoon = category.status === 'coming_soon';

  return (
    <motion.button
      type="button"
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all border ${active ? 'bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white border-transparent shadow-lg shadow-purple-200' : 'bg-white border-gray-100 text-gray-700 hover:border-purple-200 hover:bg-purple-50'}`}
    >
      <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center ${active ? 'bg-white/15' : 'bg-gray-50'}`}>
        {category.icon ? (
          <img src={category.icon} alt={category.title} className="w-7 h-7 object-contain" />
        ) : (
          <span className="text-sm font-black">{category.title?.[0]}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold truncate">{category.title}</div>
        {isComingSoon ? (
          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-amber-400/30 text-amber-100' : 'bg-amber-100 text-amber-700'}`}>
            Coming Soon
          </span>
        ) : (
          <div className={`text-[11px] truncate ${active ? 'text-white/80' : 'text-gray-400'}`}>{category.subtitle || 'Premium service'}</div>
        )}
      </div>
    </motion.button>
  );
};

export default SidebarCategory;
