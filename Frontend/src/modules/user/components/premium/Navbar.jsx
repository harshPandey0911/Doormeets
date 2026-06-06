import React from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiChevronDown, FiMapPin, FiSearch, FiShoppingBag } from 'react-icons/fi';
import Logo from '../../../../components/common/Logo';
import NotificationBell from '../common/NotificationBell';

const Navbar = ({ locationLabel = 'Select location', cartCount = 0, onSearchClick, onLocationClick }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 w-full">
        <Link to="/user/home" className="shrink-0">
          <Logo className="h-9 w-auto" />
        </Link>

        <button
          type="button"
          onClick={onLocationClick}
          className="hidden md:flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-left shadow-sm hover:border-gray-300 hover:shadow-md transition-all"
        >
          <FiMapPin className="text-gray-900" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Location</div>
            <div className="flex items-center gap-1 text-xs font-semibold text-gray-900 truncate max-w-44">
              <span className="truncate">{locationLabel}</span>
              <FiChevronDown className="text-gray-400" />
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <NotificationBell />
          <Link to="/user/cart" className="relative rounded-2xl border border-gray-200 bg-white p-3 shadow-sm hover:border-gray-300 hover:shadow-md transition-all">
            <FiShoppingBag className="text-gray-800" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full bg-black px-1 text-[10px] font-black leading-5 text-white text-center">
                {cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
