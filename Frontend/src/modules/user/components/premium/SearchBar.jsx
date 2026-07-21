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
      <label
        className="flex items-center gap-3 rounded-md border px-4 py-3 shadow-sm transition-all bg-white dark:bg-zinc-900"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <FiSearch className="text-gray-400 shrink-0" />
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-gray-400"
        />
      </label>
    </form>
  );
};

export default SearchBar;
