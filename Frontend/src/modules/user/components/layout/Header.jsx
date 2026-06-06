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
    <header className="w-full bg-transparent px-5 pt-5 pb-3">
      <div className="max-w-lg lg:max-w-2xl mx-auto flex items-center justify-between">
        
        {/* Left Side: Pin Icon and Location Label */}
        <div 
          onClick={onLocationClick}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          {/* Orange Pin Icon matching theme */}
          <div className="w-10 h-10 rounded-full bg-[#FF9F45]/10 flex items-center justify-center border border-[#FF9F45]/20 shadow-sm shrink-0">
            <HiLocationMarker className="w-5 h-5 text-[#FF9F45]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-1">
              Location
            </span>
            <span className="text-base font-extrabold text-gray-900 leading-tight truncate max-w-[200px] sm:max-w-[300px]">
              {displayLocation}
            </span>
          </div>
        </div>

        {/* Right Side: Notification Bell */}
        <div className="flex items-center gap-3.5 shrink-0">
          {/* Dynamic premium notification bell */}
          <NotificationBell notificationCount={unreadCount} />
        </div>

      </div>
    </header>
  );
};

export default Header;
