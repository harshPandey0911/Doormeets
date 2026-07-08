import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiCalendar, FiShoppingCart, FiUser } from 'react-icons/fi';
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
    <header className="w-full bg-transparent px-5 pt-6 pb-2">
      <div className="max-w-lg md:max-w-4xl lg:max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* Left Side: Location Selector & Bold Heading */}
        <div className="flex flex-col min-w-0">
          <div
            onClick={onLocationClick}
            className="flex items-center gap-1 cursor-pointer select-none text-[12px] transition-colors capitalize font-bold text-muted-text hover:text-brand"
          >
            <span>{displayLocation}</span>
            <svg
              className="w-3 h-3 text-muted-text/80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <h1
            className="text-[20px] font-extrabold leading-snug tracking-tight mt-1 text-dark-text max-w-[280px] md:max-w-none md:whitespace-nowrap"
          >
            What you are looking for today
          </h1>
        </div>

        {/* Middle Search Bar on Desktop */}
        <div className="hidden md:block flex-1 max-w-xl mx-4">
          <SearchBar onInputClick={onSearchClick} />
        </div>

        {/* Right Side: Desktop Nav Menu + Theme Toggle + Notification Bell */}
        <div className="flex items-center gap-3.5 shrink-0">

          {/* Desktop Horizontal Menu Bar - hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1.5 mr-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = locationPath.pathname === item.path ||
                (item.path === '/user/home' && locationPath.pathname === '/user/home/');
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all duration-300 active:scale-95 cursor-pointer border ${
                    isActive 
                      ? 'bg-brand text-white border-brand/10 shadow-sm shadow-brand/10' 
                      : 'bg-transparent text-secondary-text border-transparent hover:bg-divider/60 hover:text-dark-text'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.isCart && cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand text-white text-[8px] font-black rounded-full min-w-[15px] h-[15px] flex items-center justify-center border-2 border-white dark:border-black shadow-sm">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 bg-slate-100/80 dark:bg-zinc-800 hover:bg-slate-200/80 dark:hover:bg-zinc-700/80 text-secondary-text hover:text-dark-text cursor-pointer"
          >
            {isDark ? (
              /* Sun icon — shown in dark mode */
              <svg
                className="w-4 h-4 text-amber-500 fill-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
                />
              </svg>
            ) : (
              /* Moon icon — shown in light mode */
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          <NotificationBell notificationCount={unreadCount} />
        </div>

      </div>
    </header>
  );
};

export default Header;
