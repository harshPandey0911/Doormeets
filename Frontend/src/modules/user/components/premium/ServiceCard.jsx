import React from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiShare2, FiPlus, FiTrash2 } from 'react-icons/fi';
import QuantityButton from './QuantityButton';
import PriceTag from './PriceTag';

const ServiceCard = ({ service, quantity = 0, onAdd, onIncrease, onDecrease, onOpen, onWishlist, onShare }) => {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-[0_10px_35px_rgba(17,24,39,0.06)] transition-all"
    >
      <button type="button" onClick={() => onOpen?.(service)} className="flex w-full items-start gap-4 text-left">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-gradient-to-br from-purple-50 to-white border border-purple-100">
          {service.image ? (
            <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                <span>★ {service.rating || 4.8}</span>
                <span className="text-gray-300">|</span>
                <span>{service.reviews || 0} reviews</span>
              </div>
              <h3 className="mt-1 text-[15px] font-black leading-snug text-gray-900 line-clamp-2">{service.title}</h3>
            </div>
            <div className="flex gap-2 text-gray-400">
              <button type="button" onClick={(e) => { e.stopPropagation(); onWishlist?.(service); }} className="rounded-full p-2 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                <FiHeart />
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onShare?.(service); }} className="rounded-full p-2 hover:bg-purple-50 hover:text-purple-600 transition-colors">
                <FiShare2 />
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm leading-5 text-gray-500 line-clamp-2">{service.description}</p>
        </div>
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <PriceTag price={service.price} originalPrice={service.originalPrice} />
        {quantity > 0 ? (
          <QuantityButton quantity={quantity} onIncrement={() => onIncrease?.(service)} onDecrement={() => onDecrease?.(service)} />
        ) : (
          <button type="button" onClick={() => onAdd?.(service)} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-purple-200 transition-transform hover:scale-[1.02]">
            <FiPlus /> Add
          </button>
        )}
      </div>
    </motion.article>
  );
};

export default ServiceCard;
