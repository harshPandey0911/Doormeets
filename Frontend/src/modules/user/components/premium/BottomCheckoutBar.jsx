import React from 'react';
import PriceTag from './PriceTag';

const BottomCheckoutBar = ({ total, originalTotal, buttonText = 'Checkout', onClick, note = 'Inclusive of taxes and charges', hasBottomNav = false }) => {
  return (
    <div 
      className={`fixed inset-x-0 ${hasBottomNav ? 'bottom-[68px] pb-3' : 'bottom-0 pb-[calc(env(safe-area-inset-bottom)+18px)]'} z-30 border-t px-4 pt-3 backdrop-blur-xl`}
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)'
      }}
    >
      <div 
        className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-md border px-3.5 py-2 shadow-[0_8px_24px_rgba(17,24,39,0.06)]"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)'
        }}
      >
        <div>
          <div className="text-[9px] font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>Total payable</div>
          <div className="flex items-baseline gap-1.5 mt-0.5 font-black text-base" style={{ color: 'var(--text-primary)' }}>
            <span>₹{total}</span>
            {originalTotal && (
              <span className="text-[11px] line-through font-normal" style={{ color: 'var(--text-muted)' }}>₹{originalTotal}</span>
            )}
          </div>
          <div className="mt-0.5 text-[9px] leading-none" style={{ color: 'var(--text-secondary)' }}>{note}</div>
        </div>
        <button 
          type="button" 
          onClick={onClick} 
          className="rounded-md px-4 py-2 text-xs font-bold shadow-md transition-transform hover:scale-[1.02] text-white"
          style={{
            backgroundColor: 'var(--primary)'
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default BottomCheckoutBar;


