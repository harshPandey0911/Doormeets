import React from 'react';
import { FiSearch, FiSliders, FiX } from 'react-icons/fi';

const SearchToolbar = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  brandFilter,
  onBrandFilterChange,
  sortOption,
  onSortChange,
  brands = []
}) => {
  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-5 mb-8">
      {/* Search Input and Select Selectors */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Keyword Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <FiSearch className="w-5 h-5" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by customer name, phone, address, brand..."
            className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 focus:border-[#E85D3F] focus:bg-white focus:ring-4 focus:ring-[#E85D3F]/10 rounded-2xl text-sm font-semibold outline-none transition-all placeholder:text-gray-400 text-gray-800"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-650"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Brand Dropdown Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <select
              value={brandFilter}
              onChange={(e) => onBrandFilterChange(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 hover:border-gray-300 focus:border-[#E85D3F] focus:ring-4 focus:ring-[#E85D3F]/10 rounded-2xl text-xs font-bold text-gray-700 uppercase tracking-wider outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
              <FiSliders className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Sort Selector Dropdown */}
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 hover:border-gray-300 focus:border-[#E85D3F] focus:ring-4 focus:ring-[#E85D3F]/10 rounded-2xl text-xs font-bold text-gray-700 uppercase tracking-wider outline-none appearance-none cursor-pointer"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="AREA_DESC">Area: High to Low</option>
              <option value="AREA_ASC">Area: Low to High</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
              <FiSliders className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex gap-2 p-1 bg-gray-50 border border-gray-100 rounded-2xl overflow-x-auto scrollbar-hide max-w-full">
        {[
          { id: 'ALL', label: 'All Tasks' },
          { id: 'PENDING', label: 'New Inquiry' },
          { id: 'DRAFTS', label: 'Draft Quotes' },
          { id: 'REVIEW', label: 'Under Review' },
          { id: 'REVISION', label: 'Revision Required' },
          { id: 'APPROVED', label: 'Approved' }
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap active:scale-98 cursor-pointer focus:outline-none ${
                isActive
                  ? 'bg-[#E85D3F] text-white shadow-md shadow-[#E85D3F]/25'
                  : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchToolbar;
