import React, { useEffect, useState } from 'react';
import NotificationBell from '../common/NotificationBell';
import api from '../../../../services/api';
import { useTheme } from '../../../../context/ThemeContext';

const Header = ({ location, onLocationClick }) => {
  const navigate_unused = null; // kept for future use
  const [unreadCount, setUnreadCount] = useState(0);
  const { toggleTheme, isDark } = useTheme();

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
      <div className="max-w-lg lg:max-w-2xl mx-auto flex items-start justify-between">

        {/* Left Side: Location Selector & Bold Heading */}
        <div className="flex flex-col min-w-0">
          <div
            onClick={onLocationClick}
            className="flex items-center gap-1 cursor-pointer select-none text-[13px] transition-colors capitalize font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>{displayLocation}</span>
            <svg
              style={{ color: 'var(--text-muted)' }}
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <h1
            className="text-[21px] font-semibold leading-[1.25] tracking-tight mt-1.5 max-w-[280px]"
            style={{ color: 'var(--text-primary)' }}
          >
            What you are looking for today
          </h1>
        </div>

        {/* Right Side: Theme Toggle + Notification Bell */}
        <div className="flex items-center gap-3.5 shrink-0 pt-1">

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 border"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)',
              boxShadow: 'var(--shadow)',
            }}
          >
            {isDark ? (
              /* Sun icon — shown in dark mode */
              <svg
                className="w-4 h-4 text-yellow-400"
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
                style={{ color: 'var(--text-secondary)' }}
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
