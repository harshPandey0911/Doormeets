import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiCalendar, FiShoppingCart, FiUser, FiInfo, FiMessageSquare, FiChevronDown } from 'react-icons/fi';
import { useCart } from '../../../../context/CartContext';
import NotificationBell from '../common/NotificationBell';
import api from '../../../../services/api';
import { useTheme } from '../../../../context/ThemeContext';
import SearchBar from '../../pages/Home/components/SearchBar';

const Header = ({ location, onLocationClick, onSearchClick }) => {
  const navigate = useNavigate();
  const locationPath = useLocation();
  const { cartCount } = useCart();
  const [unreadCount, setUnreadCount] = useState(0);
  const { toggleTheme, isDark } = useTheme();

  const menuItems = [
    { id: 'cart', label: 'Cart', icon: FiShoppingCart, path: '/user/cart', isCart: true },
    { id: 'account', label: 'Account', icon: FiUser, path: '/user/account' },
  ];

  // Load dynamic unread notifications count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!token) return;
        const res = await api.get('/notifications/user');
        if (res.data.success && typeof res.data.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (error) {
        // Silent fail
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayLocation =
    location && location !== '...' && location !== 'Select Location'
      ? location.split(',')[0].trim() +
        (location.split(',')[1] ? `, ${location.split(',')[1].trim()}` : '')
      : 'Select Location';

  return (
    <header className="w-full bg-transparent px-3 md:px-5 pt-3 pb-1 md:pt-6 md:pb-2">
      <div className="w-full max-w-[1600px] mx-auto flex items-start justify-between px-0 md:px-10">

        {/* Left Side: Location Selector & Bold Heading */}
        <div className="flex flex-col min-w-0">
          <div
            onClick={onLocationClick}
            className="flex items-center gap-1 cursor-pointer select-none text-[11px] md:text-sm lg:text-[15px] transition-colors capitalize font-medium opacity-90"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>{displayLocation}</span>
            <FiChevronDown className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 shrink-0 opacity-80" style={{ color: 'var(--text-secondary)' }} />
          </div>
          <h1
            className="text-[15px] xs:text-[17px] sm:text-lg md:text-[22px] font-bold leading-tight tracking-tight mt-0.5 md:mt-1.5 whitespace-nowrap"
            style={{ color: 'var(--text-primary)' }}
          >
            What you are looking for today
          </h1>
        </div>

        {/* Middle Search Bar on Desktop */}
        <div className="hidden md:block flex-1 max-w-4xl mx-4 md:mx-6 lg:mx-8 self-center">
          <SearchBar onInputClick={onSearchClick} />
        </div>

        {/* Right Side: Desktop Nav Menu + Theme Toggle + Notification Bell */}
        <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0 pt-1">

          {/* Desktop/Tablet Horizontal Menu Bar - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-2.5 mr-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = locationPath.pathname === item.path ||
                (item.path === '/user/home' && locationPath.pathname === '/user/home/');
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  className="relative w-8 h-8 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 border cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5" />
                  {item.isCart && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] md:text-[10px] font-bold rounded-full min-w-[16px] md:min-w-[18px] h-[16px] md:h-[18px] flex items-center justify-center border-2 border-white dark:border-zinc-900">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Search Icon Button */}
          <button
            onClick={onSearchClick}
            title="Search Services"
            className="w-8 h-8 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 border cursor-pointer"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <svg
              className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <NotificationBell notificationCount={unreadCount} />
        </div>

      </div>
    </header>
  );
};

export default Header;
