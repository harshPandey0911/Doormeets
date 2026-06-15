import React from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiShare2, FiPlus, FiTrash2 } from 'react-icons/fi';
import QuantityButton from './QuantityButton';
import PriceTag from './PriceTag';

const ServiceCard = ({ service, quantity = 0, onAdd, onIncrease, onDecrease, onOpen, onWishlist, onShare }) => {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      className="rounded-[20px] sm:rounded-[24px] border p-3 sm:p-4 shadow-[0_8px_30px_rgba(17,24,39,0.04)] dark:shadow-none transition-all"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)'
      }}
    >
      <div onClick={() => onOpen?.(service)} className="flex w-full items-start gap-3 sm:gap-4 text-left cursor-pointer">
        <div 
          className="h-16 w-16 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl sm:rounded-[20px] bg-gradient-to-br from-orange-50/40 to-white dark:from-gray-800 dark:to-gray-900 border"
          style={{ borderColor: 'var(--border)' }}
        >
          {service.image ? (
            <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-normal text-amber-500">
                <span>★ {service.rating || 4.8}</span>
                <span style={{ color: 'var(--border)' }}>|</span>
                <span style={{ color: 'var(--text-muted)' }}>{service.reviews || 0} reviews</span>
              </div>
              <h3 className="mt-0.5 text-sm sm:text-[15px] font-normal leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                {service.title ? service.title.charAt(0).toUpperCase() + service.title.slice(1).toLowerCase() : ''}
              </h3>
            </div>
            <div className="flex gap-1 text-gray-400 dark:text-gray-500">
              <button type="button" onClick={(e) => { e.stopPropagation(); onWishlist?.(service); }} className="rounded-full p-1.5 sm:p-2 hover:bg-orange-50 dark:hover:bg-gray-800 hover:text-[#B33A35] transition-colors">
                <FiHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onShare?.(service); }} className="rounded-full p-1.5 sm:p-2 hover:bg-orange-50 dark:hover:bg-gray-800 hover:text-[#B33A35] transition-colors">
                <FiShare2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
          <p className="mt-1 text-[11px] sm:text-sm leading-normal line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{service.description}</p>
        </div>
      </div>

      <div className="mt-2.5 sm:mt-4 flex items-center justify-between gap-3">
        <PriceTag price={service.price} originalPrice={service.originalPrice} className="scale-[0.88] sm:scale-100 origin-left" />
        {quantity > 0 ? (
          <QuantityButton quantity={quantity} onIncrement={() => onIncrease?.(service)} onDecrement={() => onDecrease?.(service)} />
        ) : (
          <button type="button" onClick={(e) => onAdd?.(service, e)} className="inline-flex items-center gap-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#B33A35] to-[#9E2E2A] px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-normal text-white shadow-lg shadow-orange-100 transition-transform hover:scale-[1.02]">
            <FiPlus /> Add
          </button>
        )}
      </div>
    </motion.article>
  );
};

export default ServiceCard;


