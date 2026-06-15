import React from 'react';
import PriceTag from './PriceTag';

const BottomCheckoutBar = ({ total, originalTotal, buttonText = 'Checkout', onClick, note = 'Inclusive of taxes and charges' }) => {
  return (
    <div 
      className="fixed inset-x-0 bottom-[68px] lg:bottom-0 z-30 border-t px-4 pb-3 lg:pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl"
      style={{
        backgroundColor: 'var(--background)',
        borderColor: 'var(--border)'
      }}
    >
      <div 
        className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-[28px] border px-4 py-3 shadow-[0_12px_30px_rgba(17,24,39,0.08)]"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)'
        }}
      >
        <div>
          <div className="text-[10px] font-normal uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>Total payable</div>
          <PriceTag price={total} originalPrice={originalTotal} className="mt-1" />
          <div className="mt-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>{note}</div>
        </div>
        <button 
          type="button" 
          onClick={onClick} 
          className="rounded-2xl px-5 py-3 text-xs font-normal shadow-lg transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--background)'
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default BottomCheckoutBar;


