import React from 'react';
import { motion } from 'framer-motion';

const BrandCard = ({ brand, active = false, onClick }) => {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex flex-col items-center shrink-0 w-12 sm:w-16 select-none cursor-pointer"
    >
      <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white flex items-center justify-center border transition-all duration-200 overflow-hidden ${
        active 
          ? 'border-brand border-2 shadow-sm' 
          : 'border-gray-200 hover:border-brand/40 shadow-[0_2px_6px_rgba(0,0,0,0.02)]'
      }`}>
        {brand.image ? (
          <img src={brand.image} alt={brand.title} className="w-7 h-7 sm:w-9 sm:h-9 object-contain" />
        ) : (
          <div className="w-full h-full bg-white text-brand flex items-center justify-center font-bold text-xs sm:text-sm">
            {brand.title?.[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <span className={`text-[9px] sm:text-[10px] font-medium mt-1 text-center truncate w-full ${
        active ? 'text-brand font-bold' : 'text-gray-600'
      }`}>
        {brand.title ? brand.title.charAt(0).toUpperCase() + brand.title.slice(1).toLowerCase() : ''}
      </span>
    </motion.button>
  );
};

export default BrandCard;
