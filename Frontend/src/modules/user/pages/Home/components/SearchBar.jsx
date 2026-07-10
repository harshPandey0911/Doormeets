import React, { useState, useEffect } from 'react';
import { FiSearch } from 'react-icons/fi';
import { themeColors } from '../../../../../theme';

const SearchBar = ({ onInputClick }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);

  const serviceNames = [
    'Facial',
    'AC service',
    'Washing machine',
    'Cooler repair',
    'RO installation',
    'Microwave repair',
    'Geyser repair',
    'Bathroom appliance'
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
          {/* Search icon */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <FiSearch
              className="w-[20px] h-[20px] text-gray-500 transition-colors duration-300"
            />
          </div>

          {/* Simulated Input */}
          <div
            className="w-full pl-11 pr-4 py-3 rounded-xl border transition-all duration-300 flex items-center h-[46px] overflow-hidden bg-white border-gray-200 group-hover:border-gray-300"
          >
            {/* Placeholder text with typing animation */}
            <span
              className="text-[14.5px] text-gray-400 tracking-wide font-normal flex items-center whitespace-nowrap overflow-hidden w-full"
            >
              Search for&nbsp;<span className="text-gray-500 font-medium">'{displayedText}'</span>
              <span className="animate-pulse ml-0.5 text-gray-400 font-light">|</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
