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
      className={`min-w-[96px] sm:min-w-[120px] rounded-xl sm:rounded-3xl border py-1.5 px-2.5 sm:p-3 text-left transition-all ${
        active 
          ? 'border-orange-300 bg-orange-50 shadow-sm' 
          : 'border-gray-100 bg-white hover:border-orange-200 hover:shadow-sm'
      }`}
    >
      <div className="h-10 sm:h-16 rounded-lg sm:rounded-2xl bg-gradient-to-br from-orange-50/40 to-white flex items-center justify-center mb-1.5 sm:mb-3 overflow-hidden border border-orange-100/30">
        {brand.image ? (
          <img src={brand.image} alt={brand.title} className="w-7 h-7 sm:w-12 sm:h-12 object-contain" />
        ) : (
          <div className="w-7 h-7 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl bg-gradient-to-br from-[#FF9F45] to-[#FFB86C] text-white flex items-center justify-center font-black text-[10px] sm:text-base">
            {brand.title?.[0]}
          </div>
        )}
      </div>
      <div className="text-xs sm:text-sm font-normal text-gray-900 truncate leading-tight">
        {brand.title ? brand.title.charAt(0).toUpperCase() + brand.title.slice(1).toLowerCase() : ''}
      </div>
      <div className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[9px] sm:text-xs text-gray-500 leading-none">
        <FiStar className="text-amber-500 fill-amber-500 w-2 h-2 sm:w-3 sm:h-3" />
        <span className="font-normal">{brand.rating || '4.8'}</span>
        <span className="truncate">{brand.subtitle ? brand.subtitle.charAt(0).toUpperCase() + brand.subtitle.slice(1).toLowerCase() : ''}</span>
      </div>
    </motion.button>
  );
};

export default BrandCard;
