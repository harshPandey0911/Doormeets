import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { gsap } from 'gsap';
import { themeColors } from '../../../../theme';
import api from '../../../../services/api';
import { apiCache } from '../../../../utils/apiCache';

const NOTIF_CACHE_KEY = 'user:notifications:unread';

const NotificationBell = ({ notificationCount = 0 }) => {
  const navigate = useNavigate();
  const bellRef = useRef(null);
  const bellButtonRef = useRef(null);
  const [count, setCount] = useState(notificationCount);

  // Sync prop changes
  useEffect(() => {
    if (typeof notificationCount !== 'undefined') {
      setCount(notificationCount);
    }
  }, [notificationCount]);

  // Fetch unread count (SWR: stale count shown instantly, background refresh if expired)
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!token) return;

        // SWR: show stale count immediately
        const stale = apiCache.getStale(NOTIF_CACHE_KEY);
        if (stale !== null && typeof stale === 'number') {
          setCount(stale);
          // If expired, refresh silently in background
          if (apiCache.isExpired(NOTIF_CACHE_KEY)) {
            api.get('/notifications/user').then(res => {
              if (res.data?.success && typeof res.data.unreadCount === 'number') {
                apiCache.set(NOTIF_CACHE_KEY, res.data.unreadCount, 30);
                setCount(res.data.unreadCount); // update only the badge count
              }
            }).catch(() => {});
          }
          return;
        }

        // First load — fetch normally
        const res = await api.get('/notifications/user');
        if (res.data?.success && typeof res.data.unreadCount === 'number') {
          apiCache.set(NOTIF_CACHE_KEY, res.data.unreadCount, 30);
          setCount(res.data.unreadCount);
        }
      } catch (error) {
        // Silent fail
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={bellButtonRef}
      className="relative rounded-full cursor-pointer group active:scale-95 transition-transform duration-300 z-50 shrink-0 w-8 h-8 md:w-10 md:h-10 lg:w-11 lg:h-11 flex items-center justify-center"
      style={{
        margin: '2px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        navigate('/user/notifications');
      }}
      onMouseEnter={() => {
        if (bellButtonRef.current && bellRef.current) {
          const btn = bellButtonRef.current.querySelector('button');
          gsap.to(bellButtonRef.current, { scale: 1.1, duration: 0.3, ease: 'power2.out' });
          if (btn) {
            gsap.to(btn, {
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              duration: 0.3,
              ease: 'power2.out',
            });
          }
          gsap.to(bellRef.current, { rotation: 15, scale: 1.1, duration: 0.3, ease: 'power2.out' });
        }
      }}
      onMouseLeave={() => {
        if (bellButtonRef.current && bellRef.current) {
          const btn = bellButtonRef.current.querySelector('button');
          gsap.to(bellButtonRef.current, { scale: 1.0, duration: 0.3, ease: 'power2.out' });
          if (btn) {
            gsap.to(btn, {
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
              duration: 0.3,
              ease: 'power2.out',
            });
          }
          gsap.to(bellRef.current, { rotation: 0, scale: 1.0, duration: 0.3, ease: 'power2.out' });
        }
      }}
    >
      {/* 1. Subtle Circular Border */}
      <div
        className="absolute inset-0 rounded-full z-0 border transition-colors duration-200 bg-white dark:bg-zinc-900"
        style={{ borderColor: 'var(--border)' }}
      />

      {/* 2. Inner Button */}
      <button
        className="relative z-10 w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-colors duration-200 bg-white dark:bg-zinc-900"
      >
        <div ref={bellRef} className="flex items-center justify-center">
          <FiBell className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 lg:w-5 lg:h-5 text-dark-text" />
        </div>
      </button>

      {/* 4. Active Badge (Moved outside for robustness and to prevent clipping) */}
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center z-20"
          style={{
            minWidth: '20px',
            height: '20px',
            boxShadow: '0 3px 8px rgba(239, 68, 68, 0.5)',
            border: '2px solid var(--background)'
          }}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
