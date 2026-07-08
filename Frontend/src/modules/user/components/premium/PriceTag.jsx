import React from 'react';

const PriceTag = ({ price, originalPrice, className = '' }) => {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <span className="text-2xl font-normal text-brand">₹{price}</span>
      {originalPrice ? <span className="text-sm text-gray-400 line-through font-normal">₹{originalPrice}</span> : null}
    </div>
  );
};

export default PriceTag;
