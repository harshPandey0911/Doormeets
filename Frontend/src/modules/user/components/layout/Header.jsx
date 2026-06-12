import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiLocationMarker } from 'react-icons/hi';
import { FiBell } from 'react-icons/fi';
import NotificationBell from '../common/NotificationBell';
import { themeColors } from '../../../../theme';
import api from '../../../../services/api';

const Header = ({ location, onLocationClick }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userInitial, setUserInitial] = useState('U');

  // Load user data and dynamic unread notifications count
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const userObj = JSON.parse(stored);
        if (userObj && userObj.name) {
          setUserInitial(userObj.name.charAt(0).toUpperCase());
        }
      }
    } catch (e) {
      console.error('Error loading userData initial:', e);
    }

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

  const displayLocation = location && location !== '...' && location !== 'Select Location'
    ? location.split(',')[0].trim() + (location.split(',')[1] ? `, ${location.split(',')[1].trim()}` : '')
    : 'Select Location';

  return (
    <header className="w-full bg-transparent px-5 pt-6 pb-2">
      <div className="max-w-lg lg:max-w-2xl mx-auto flex items-start justify-between">
        
        {/* Left Side: Location Selector & Bold Heading */}
        <div className="flex flex-col min-w-0">
          <div 
            onClick={onLocationClick}
            className="flex items-center gap-1 cursor-pointer select-none text-[13px] text-gray-500 hover:text-gray-700 transition-colors capitalize font-medium"
          >
            <span>{displayLocation}</span>
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <h1 className="text-[21px] font-semibold text-[#1f2937] leading-[1.25] tracking-tight mt-1.5 max-w-[280px]">
            What you are looking for today
          </h1>
        </div>

        {/* Right Side: Notification Bell */}
        <div className="flex items-center gap-3.5 shrink-0 pt-1">
          <NotificationBell notificationCount={unreadCount} />
        </div>

      </div>
    </header>
  );
};

export default Header;
