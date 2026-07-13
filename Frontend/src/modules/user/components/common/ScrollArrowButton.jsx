import React from 'react';

const ScrollArrowButton = ({ direction, onClick, className = '' }) => {
  const isLeft = direction === 'left';
  
  return (
    <button
      onClick={onClick}
      className={`absolute z-20 w-8 h-8 md:w-10 md:h-10 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center border border-gray-100 overflow-hidden group active:scale-95 transition-transform ${className}`}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] bg-black rounded-full opacity-0 group-hover:opacity-10 group-active:opacity-10 transition-all duration-300 pointer-events-none"></div>
      <svg 
        className="w-3.5 h-3.5 md:w-4 md:h-4 relative z-10 text-gray-800" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        strokeWidth="2.5"
      >
        {isLeft ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
};

export default ScrollArrowButton;
