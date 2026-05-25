import React from 'react';
import { FiSearch } from 'react-icons/fi';

const SearchBar = ({ value, onChange, onSubmit, placeholder = 'Search services, brands, categories' }) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className="w-full"
    >
      <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus-within:border-purple-300 focus-within:ring-4 focus-within:ring-purple-100 transition-all">
        <FiSearch className="text-gray-400 shrink-0" />
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
        />
      </label>
    </form>
  );
};

export default SearchBar;
