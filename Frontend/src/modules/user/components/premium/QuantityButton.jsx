import React from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';

const QuantityButton = ({ quantity = 0, onIncrement, onDecrement, className = '' }) => {
  return (
    <div className={`inline-flex items-center rounded-2xl bg-white border border-purple-100 shadow-sm overflow-hidden ${className}`}>
      <button type="button" onClick={onDecrement} className="w-9 h-9 flex items-center justify-center text-purple-700 hover:bg-purple-50 transition-colors">
        <FiMinus className="w-4 h-4" />
      </button>
      <span className="px-3 text-sm font-bold text-gray-900 min-w-[34px] text-center">{quantity}</span>
      <button type="button" onClick={onIncrement} className="w-9 h-9 flex items-center justify-center text-purple-700 hover:bg-purple-50 transition-colors">
        <FiPlus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default QuantityButton;
