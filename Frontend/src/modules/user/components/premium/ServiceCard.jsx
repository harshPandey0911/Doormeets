import React from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiShare2, FiPlus, FiTrash2 } from 'react-icons/fi';
import QuantityButton from './QuantityButton';
import PriceTag from './PriceTag';

const ServiceCard = ({ service, quantity = 0, onAdd, onIncrease, onDecrease, onOpen, onWishlist, onShare }) => {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      className="rounded-[20px] sm:rounded-[24px] border border-gray-100 bg-white p-3 sm:p-4 shadow-[0_8px_30px_rgba(17,24,39,0.04)] transition-all"
    >
      <div onClick={() => onOpen?.(service)} className="flex w-full items-start gap-3 sm:gap-4 text-left cursor-pointer">
        <div className="h-16 w-16 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl sm:rounded-[20px] bg-gradient-to-br from-orange-50/40 to-white border border-orange-100/70">
          {service.image ? (
            <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-amber-500">
                <span>★ {service.rating || 4.8}</span>
                <span className="text-gray-300">|</span>
                <span>{service.reviews || 0} reviews</span>
              </div>
              <h3 className="mt-0.5 text-sm sm:text-[15px] font-black leading-snug text-gray-900 line-clamp-2">{service.title}</h3>
            </div>
            <div className="flex gap-1 text-gray-400">
              <button type="button" onClick={(e) => { e.stopPropagation(); onWishlist?.(service); }} className="rounded-full p-1.5 sm:p-2 hover:bg-orange-50 hover:text-[#FF9F45] transition-colors">
                <FiHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onShare?.(service); }} className="rounded-full p-1.5 sm:p-2 hover:bg-orange-50 hover:text-[#FF9F45] transition-colors">
                <FiShare2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
          <p className="mt-1 text-[11px] sm:text-sm leading-normal text-gray-500 line-clamp-2">{service.description}</p>
        </div>
      </div>

      <div className="mt-2.5 sm:mt-4 flex items-center justify-between gap-3">
        <PriceTag price={service.price} originalPrice={service.originalPrice} className="scale-[0.88] sm:scale-100 origin-left" />
        {quantity > 0 ? (
          <QuantityButton quantity={quantity} onIncrement={() => onIncrease?.(service)} onDecrement={() => onDecrease?.(service)} />
        ) : (
          <button type="button" onClick={() => onAdd?.(service)} className="inline-flex items-center gap-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#FF9F45] to-[#FFB86C] px-3.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-black text-white shadow-lg shadow-orange-100 transition-transform hover:scale-[1.02]">
            <FiPlus /> Add
          </button>
        )}
      </div>
    </motion.article>
  );
};

export default ServiceCard;
