import React from 'react';
import PriceTag from './PriceTag';

const BottomCheckoutBar = ({ total, originalTotal, buttonText = 'Checkout', onClick, note = 'Inclusive of taxes and charges' }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[28px] border border-gray-100 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(17,24,39,0.08)]">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">Total payable</div>
          <PriceTag price={total} originalPrice={originalTotal} className="mt-1" />
          <div className="mt-1 text-[11px] text-gray-500">{note}</div>
        </div>
        <button type="button" onClick={onClick} className="rounded-2xl bg-black px-5 py-3 text-xs font-black text-white shadow-lg shadow-black/20 transition-transform hover:scale-[1.02]">
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default BottomCheckoutBar;
