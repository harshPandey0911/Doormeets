import React from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiChevronDown, FiMapPin, FiSearch, FiShoppingBag } from 'react-icons/fi';
import Logo from '../../../../components/common/Logo';
import NotificationBell from '../common/NotificationBell';
import Header from '../layout/Header';

const Navbar = ({ locationLabel = 'Select location', cartCount = 0, onSearchClick, onLocationClick }) => {
  const address = localStorage.getItem('currentAddress') || locationLabel;

  return (
    <>
      {/* Desktop Top Navbar (Same as Home Page Header) */}
      <div 
        className="hidden md:block fixed top-0 left-0 right-0 z-50 border-b shadow-[0_1px_0px_rgba(255,255,255,0.04)] w-full"
        style={{ backgroundColor: 'var(--background)', borderBottomColor: 'var(--border)' }}
      >
        <Header 
          location={address} 
          onLocationClick={onLocationClick} 
          onSearchClick={onSearchClick} 
        />
      </div>

      {/* Mobile Top Navbar (Original Layout) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-black/[0.03] bg-transparent backdrop-blur-xl w-full">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 w-full">
          <Link to="/user/home" className="shrink-0">
            <Logo className="h-9 w-auto" />
          </Link>

          <button
            type="button"
            onClick={onLocationClick}
            className="hidden md:flex items-center gap-2 rounded-2xl border px-3 py-2 text-left shadow-sm transition-all"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
          >
            <FiMapPin style={{ color: 'var(--text-primary)' }} />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.2em] font-normal" style={{ color: 'var(--text-muted)' }}>Location</div>
              <div className="flex items-center gap-1 text-xs font-normal truncate max-w-44" style={{ color: 'var(--text-primary)' }}>
                <span className="truncate">{locationLabel}</span>
                <FiChevronDown style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <NotificationBell />
            <Link id="nav-cart-icon" to="/user/cart" className="relative rounded-2xl border p-3 shadow-sm transition-all" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
              <FiShoppingBag style={{ color: 'var(--text-primary)' }} />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-5 h-5 rounded-full px-1 text-[10px] font-black leading-5 text-white text-center" style={{ backgroundColor: 'var(--primary)' }}>
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
