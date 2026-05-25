import React from 'react';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';

const BrandCard = ({ brand, active = false, onClick }) => {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`min-w-[120px] rounded-3xl border p-3 text-left transition-all ${active ? 'border-purple-300 bg-purple-50 shadow-md' : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-sm'}`}
    >
      <div className="h-16 rounded-2xl bg-gradient-to-br from-purple-50 to-white flex items-center justify-center mb-3 overflow-hidden">
        {brand.image ? (
          <img src={brand.image} alt={brand.title} className="w-12 h-12 object-contain" />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white flex items-center justify-center font-black">{brand.title?.[0]}</div>
        )}
      </div>
      <div className="text-sm font-bold text-gray-900 truncate">{brand.title}</div>
      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
        <FiStar className="text-amber-500" />
        <span>{brand.rating || '4.8'}</span>
        <span className="truncate">{brand.subtitle || ''}</span>
      </div>
    </motion.button>
  );
};

export default BrandCard;
