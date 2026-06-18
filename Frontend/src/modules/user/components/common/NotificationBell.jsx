import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { gsap } from 'gsap';
import { themeColors } from '../../../../theme';
import api from '../../../../services/api';

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

  // Fetch unread count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!token) return; // Not logged in, count 0

        const res = await api.get('/notifications/user');
        if (res.data.success && typeof res.data.unreadCount === 'number') {
          setCount(res.data.unreadCount);
        }
      } catch (error) {
        // Silent fail (e.g. 401 not logged in)
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={bellButtonRef}
      className="relative rounded-full cursor-pointer group active:scale-95 transition-transform duration-300 z-50 shrink-0"
      style={{
        width: '42px',
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        className="absolute inset-0 rounded-full z-0 border border-black/[0.12] bg-white shadow-sm"
      />

      {/* 2. Inner Button */}
      <button
        className="relative z-10 w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-white"
      >
        <svg width="0" height="0" className="absolute">
          <linearGradient id="doormeets-bell-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={themeColors.brand.teal} />
            <stop offset="50%" stopColor={themeColors.brand.yellow} />
            <stop offset="100%" stopColor={themeColors.brand.orange} />
          </linearGradient>
        </svg>

        <svg
          ref={bellRef}
          className="w-5.5 h-5.5 transition-all duration-300"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            stroke: '#000000',
            color: 'transparent',
          }}
        >
          {/* Top Loop */}
          <path d="M12 3a2 2 0 00-2 2h4a2 2 0 00-2-2z" />
          {/* Bell Body */}
          <path d="M12 5a4.5 4.5 0 00-4.5 4.5v3.5c0 1.2-1 2.2-1.5 2.5h12s-1.5-1-1.5-2.5v-3.5A4.5 4.5 0 0012 5z" />
          {/* Clapper */}
          <path d="M10 17.5a2 2 0 004 0" />
          {/* Left waves */}
          <path d="M4 8a5.5 5.5 0 000 8" />
          <path d="M2 5.5a9.5 9.5 0 000 13" />
          {/* Right waves */}
          <path d="M20 8a5.5 5.5 0 010 8" />
          <path d="M22 5.5a9.5 9.5 0 010 13" />
        </svg>
      </button>

      {/* 4. Active Badge (Moved outside for robustness and to prevent clipping) */}
      {count > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center z-20"
          style={{
            minWidth: '20px',
            height: '20px',
            boxShadow: '0 3px 8px rgba(239, 68, 68, 0.5), 0 0 0 2px #fff',
            border: '2px solid #fff'
          }}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
