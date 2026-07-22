import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import Logo from '../../../../components/common/Logo';
import api from '../../../../services/api';
import NotificationBell from '../../../../modules/user/components/common/NotificationBell';

const Header = memo(({
  title,
  onBack,
  showBack = true,
  showSearch = false,
  showNotifications = true,
  notificationCount = 0,
  showOnlineToggle = true
}) => {
  const navigate = useNavigate();
  const [count, setCount] = useState(notificationCount);

  // Sync prop changes
  useEffect(() => {
    if (typeof notificationCount !== 'undefined') {
      setCount(notificationCount);
    }
  }, [notificationCount]);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notifications/vendor');
        if (res.data.success && typeof res.data.unreadCount === 'number') {
          setCount(res.data.unreadCount);
        }
      } catch (error) {
        // Silent fail
      }
    };

    if (showNotifications) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
  }, [showNotifications]);

  const [isOnline, setIsOnline] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Sync online status
  useEffect(() => {
    let vendorData = {};
    const isWorker = localStorage.getItem('role') === 'worker';
    const storageKey = isWorker ? 'workerData' : 'vendorData';
    try { vendorData = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (e) { /* corrupted */ }
    if (vendorData.isOnline !== undefined) {
      setIsOnline(vendorData.isOnline);
    }

    const handleStatusUpdate = (e) => {
      if (e.detail?.isOnline !== undefined) {
        setIsOnline(e.detail.isOnline);
      }
    };

    window.addEventListener('vendorStatusChanged', handleStatusUpdate);
    return () => window.removeEventListener('vendorStatusChanged', handleStatusUpdate);
  }, []);

  const handleToggleOnline = async (e) => {
    e.stopPropagation();
    try {
      setIsToggling(true);
      const newStatus = !isOnline;
      const response = await vendorDashboardService.updateStatus(newStatus);
      if (response.success) {
        setIsOnline(newStatus);
        toast.success(`You are now ${newStatus ? 'Online' : 'Offline'}`);
        
        // Update localStorage
        let vendorData = {};
        const isWorker = localStorage.getItem('role') === 'worker';
        const storageKey = isWorker ? 'workerData' : 'vendorData';
        try { vendorData = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (e) { /* corrupted */ }
        vendorData.isOnline = newStatus;
        localStorage.setItem(storageKey, JSON.stringify(vendorData));

        // Dispatch event for other components (like Dashboard)
        window.dispatchEvent(new CustomEvent('vendorStatusChanged', { detail: { isOnline: newStatus } }));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsToggling(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleNotifications = () => {
    navigate('/vendor/notifications');
  };

  const handleLogoClick = () => {
    navigate('/vendor/dashboard');
  };

  return (
    <>
      <header
        className="w-full bg-[#fefefe] fixed top-0 left-0 right-0 z-50"
        style={{
          borderBottom: '1.5px solid rgba(150, 52, 247, 0.15)',
        }}
      >
        <div className="px-3.5 py-1.5 md:py-2.5 flex items-center justify-between gap-2">
          {/* Left: Back button or Logo */}
          <div className="flex items-center gap-1.5">
            {showBack ? (
              <motion.button
                onClick={handleBack}
                className="-ml-1.5 p-1.5 rounded-full hover:bg-white/30 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <FiArrowLeft className="w-4.5 h-4.5 md:w-5 md:h-5" style={{ color: themeColors.button }} />
              </motion.button>
            ) : (
              <motion.div
                className="cursor-pointer"
                onClick={handleLogoClick}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Logo className="h-8 md:h-10 w-auto" />
              </motion.div>
            )}
            {showBack && <h1 className="text-base md:text-lg font-bold text-gray-800 whitespace-nowrap">{title || 'Vendor'}</h1>}
          </div>

          {/* Right: Search and Notifications */}
          <div className="flex items-center gap-2">
            {showSearch && (
              <button
                className="p-1.5 rounded-full hover:bg-white/30 transition-colors active:scale-95"
                onClick={() => navigate('/vendor/jobs')}
              >
                <FiSearch className="w-4.5 h-4.5 md:w-5 md:h-5" style={{ color: themeColors.button }} />
              </button>
            )}
            
            {showOnlineToggle && (
              <div className="flex items-center gap-1.5 mr-0.5">
                <button
                  onClick={handleToggleOnline}
                  disabled={isToggling}
                  className={`relative w-9 h-5 rounded-full transition-all duration-300 flex items-center px-0.5 shadow-inner ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <motion.div
                    animate={{ x: isOnline ? 16 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center"
                  >
                    {isToggling ? (
                      <div className="w-2 h-2 border-2 border-[#9634f7] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    )}
                  </motion.div>
                </button>
                <span className="hidden min-[400px]:inline-block text-[9px] font-bold text-gray-500 uppercase tracking-tighter w-12">
                  {isOnline ? 'Offline' : 'Online'}
                </span>
              </div>
            )}

            {showNotifications && (
              <NotificationBell
                notificationCount={count}
                userType="vendor"
                onClick={handleNotifications}
              />
            )}
          </div>
        </div>
      </header>
      <div className="h-[44px] md:h-[50px] shrink-0" />
    </>
  );
});

Header.displayName = 'VendorHeader';
export default Header;
