import React from 'react';

const PriceTag = ({ price, originalPrice, className = '' }) => {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <span className="text-2xl font-black text-purple-700">₹{price}</span>
      {originalPrice ? <span className="text-sm text-gray-400 line-through font-semibold">₹{originalPrice}</span> : null}
    </div>
  );
};

export default PriceTag;
