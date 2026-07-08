import React, { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { themeColors } from '../../../../../theme';

const SearchBar = React.memo(({ onInputClick }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);

  const serviceNames = [
    'AC service and repair',
    'Washing machine services',
    'Cooler repair at Home',
    'R.O. repair installation',
    'Microwave repair',
    'Geyser repair',
    'Bathroom appliance installation',
    'Fridge at Home'
  ];

  useEffect(() => {
    let timer;
    const currentFullText = serviceNames[currentServiceIndex];

    if (isTyping) {
      if (displayedText.length < currentFullText.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1));
        }, 150);
      } else {
        timer = setTimeout(() => setIsTyping(false), 2000);
      }
    } else {
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length - 1));
        }, 100);
      } else {
        setCurrentServiceIndex((prev) => (prev + 1) % serviceNames.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedText, isTyping, currentServiceIndex]);

  return (
    <div className="flex items-center w-full min-w-0">
      <div className="flex-1 min-w-0 relative cursor-pointer" onClick={onInputClick}>
        <div className="relative w-full group">
          {/* Glow effect on hover */}
          <div
            className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `linear-gradient(90deg, ${themeColors.brand.teal}0F, ${themeColors.brand.orange}0F)` }}
          />

          {/* Gradient Definition */}
          <svg width="0" height="0" className="absolute">
            <linearGradient id="doormeets-search-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={themeColors.brand.teal} />
              <stop offset="50%" stopColor={themeColors.brand.orange} />
              <stop offset="100%" stopColor={themeColors.brand.yellow} />
            </linearGradient>
          </svg>

          {/* Search icon */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <FiSearch
              className="w-5 h-5 transition-colors duration-300"
              style={{ stroke: 'url(#doormeets-search-gradient)' }}
            />
          </div>

          {/* Simulated Input */}
          <div
            className="w-full pl-12 pr-4 py-3.5 rounded-3xl text-[15px] border border-border/80 bg-surface/85 backdrop-blur-md transition-all duration-300 flex items-center h-[52px] overflow-hidden shadow-sm group-hover:border-brand/40 group-hover:shadow-md"
          >
            {/* Placeholder text with typing animation */}
            <span
              className="text-[14px] tracking-wide font-semibold flex items-center gap-1.5 whitespace-nowrap overflow-hidden w-full text-muted-text"
            >
              Search for <span
                className="font-extrabold truncate max-w-[120px] xs:max-w-[180px] sm:max-w-[280px]"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.brand.teal} 0%, ${themeColors.brand.orange} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent'
                }}
              >
                {displayedText}
              </span>
              <span className="animate-pulse -ml-0.5 text-brand">|</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
