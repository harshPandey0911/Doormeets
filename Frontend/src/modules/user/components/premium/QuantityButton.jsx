import React from 'react';
import { FiMinus, FiPlus } from 'react-icons/fi';

const QuantityButton = ({ quantity = 0, onIncrement, onDecrement, className = '' }) => {
  return (
    <div 
      className={`inline-flex items-center rounded-2xl border shadow-sm overflow-hidden ${className}`}
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)'
      }}
    >
      <button 
        type="button" 
        onClick={onDecrement} 
        className="w-9 h-9 flex items-center justify-center transition-colors animate-active"
        style={{ color: 'var(--primary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--divider)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <FiMinus className="w-4 h-4" />
      </button>
      <span className="px-3 text-sm font-bold min-w-[34px] text-center" style={{ color: 'var(--text-primary)' }}>{quantity}</span>
      <button 
        type="button" 
        onClick={onIncrement} 
        className="w-9 h-9 flex items-center justify-center transition-colors animate-active"
        style={{ color: 'var(--primary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--divider)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <FiPlus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default QuantityButton;

