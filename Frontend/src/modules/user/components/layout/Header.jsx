import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiCalendar, FiShoppingCart, FiUser, FiInfo, FiMessageSquare } from 'react-icons/fi';
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
    { id: 'home', label: 'Home', icon: FiHome, path: '/user/home' },
    { id: 'about', label: 'About Us', icon: FiInfo, path: '/user/about' },
    { id: 'contact', label: 'Contact Us', icon: FiMessageSquare, path: '/user/contact' },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar, path: '/user/my-bookings' },
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
            className="flex items-center gap-1 cursor-pointer select-none text-[11px] md:text-xs transition-colors capitalize font-medium opacity-90"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>{displayLocation}</span>
            <svg
              style={{ color: 'var(--text-muted)' }}
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <h1
            className="text-[15px] xs:text-[17px] sm:text-lg md:text-[22px] font-bold leading-tight tracking-tight mt-0.5 md:mt-1.5 whitespace-nowrap"
            style={{ color: 'var(--text-primary)' }}
          >
            What you are looking for today
          </h1>
        </div>

        {/* Middle Search Bar on Desktop */}
        <div className="hidden md:block flex-1 max-w-2xl mx-8 self-center">
          <SearchBar onInputClick={onSearchClick} />
        </div>

        {/* Right Side: Desktop Nav Menu + Theme Toggle + Notification Bell */}
        <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0 pt-1">

          {/* Desktop Horizontal Menu Bar - hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1 mr-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = locationPath.pathname === item.path ||
                (item.path === '/user/home' && locationPath.pathname === '/user/home/');
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-bold transition-all duration-200 active:scale-95 border-b-2"
                  style={{
                    backgroundColor: 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    borderColor: isActive ? 'var(--primary)' : 'transparent',
                    borderRadius: '0px'
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.isCart && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center border-2 border-white">
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
            className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 border cursor-pointer"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <svg
              className="w-3.5 h-3.5 md:w-4 md:h-4"
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
