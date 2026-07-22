import React, { useState, useEffect, memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiBriefcase, FiUsers, FiUser, FiBox } from 'react-icons/fi';
import { HiHome, HiBriefcase, HiUsers, HiUser, HiViewGrid } from 'react-icons/hi';
import { FaWallet, FaHardHat } from 'react-icons/fa';
import { vendorTheme as themeColors } from '../../../../theme';

const BottomNav = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingJobsCount, setPendingJobsCount] = useState(0);

  // Load pending jobs count from localStorage
  useEffect(() => {
    const updatePendingCount = () => {
      try {
        // Count active jobs (PENDING only) to show new requests
        const acceptedBookings = JSON.parse(localStorage.getItem('vendorAcceptedBookings') || '[]');
        const activeJobs = acceptedBookings.filter(job => job.status === 'PENDING');
        setPendingJobsCount(activeJobs.length);
      } catch (error) {
        console.error('Error reading pending jobs:', error);
      }
    };

    updatePendingCount();
    window.addEventListener('storage', updatePendingCount);
    window.addEventListener('vendorJobsUpdated', updatePendingCount);

    return () => {
      window.removeEventListener('storage', updatePendingCount);
      window.removeEventListener('vendorJobsUpdated', updatePendingCount);
    };
  }, []);

  const navItems = useMemo(() => {
    const badgeCount = pendingJobsCount;
    const isWorker = localStorage.getItem('role') === 'worker' || location.pathname.startsWith('/worker');
    const prefix = isWorker ? '/worker' : '/vendor';

    return [
      { path: `${prefix}/dashboard`, icon: FiHome, activeIcon: HiHome, label: 'Home' },
      { path: `${prefix}/jobs`, icon: FiBriefcase, activeIcon: HiBriefcase, label: 'Active Jobs', badge: badgeCount },
      { path: `${prefix}/wallet`, icon: FaWallet, activeIcon: FaWallet, label: 'Wallet' },
      { path: `${prefix}/profile`, icon: FiUser, activeIcon: HiUser, label: 'Profile' },
    ];
  }, [pendingJobsCount, location.pathname]);

  const handleNavClick = (path) => {
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  // Hide nav when specific routes are active (booking alerts, maps)
  const hideNavRoutes = [
    '/vendor/booking-alert/',
    '/vendor/booking/',
  ];

  const shouldHideNav = hideNavRoutes.some(route =>
    location.pathname.includes(route) &&
    (location.pathname.includes('/map') || location.pathname.includes('/alert/'))
  );

  if (shouldHideNav) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 40,
        willChange: 'transform',
        transform: 'translateZ(0)',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.06)',
        paddingBottom: 'max(4px, env(safe-area-inset-bottom, 4px))',
      }}
    >
      <div className="flex items-center justify-around px-1 py-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const prefix = localStorage.getItem('role') === 'worker' ? '/worker' : '/vendor';
          const isActive = location.pathname === item.path ||
            (item.path === `${prefix}/dashboard` && (location.pathname === '/vendor' || location.pathname === '/worker'));
          const IconComponent = isActive ? item.activeIcon : item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="flex-1 max-w-[80px] flex flex-col items-center justify-center relative h-11 md:h-12 rounded-md transition-all duration-200 group active:scale-95"
            >
              {/* Active Indicator Bar - Top Accent */}
              {isActive && (
                <div
                  className="absolute -top-1 w-10 h-[3px] rounded-b-full z-20"
                  style={{
                    background: themeColors.gradient,
                    boxShadow: `0 2px 6px ${themeColors.brand.teal}66`,
                  }}
                />
              )}

              {/* Active Background - Very Subtle Tint */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-md"
                  style={{ backgroundColor: `${themeColors.brand.teal}0D` }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center justify-center py-0.5">
                <div className="relative">
                  <IconComponent
                    className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-105' : 'text-gray-400 group-hover:text-gray-600'}`}
                    style={{
                      color: isActive ? themeColors.button : '#9CA3AF',
                    }}
                  />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className="absolute bg-gradient-to-br from-red-500 to-red-600 text-white font-bold rounded-full flex items-center justify-center z-50"
                      style={{
                        top: '-5px',
                        right: '-7px',
                        minWidth: '15px',
                        height: '15px',
                        padding: '0 3px',
                        fontSize: '9px',
                        lineHeight: '15px',
                        border: '1.5px solid white',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                      }}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[9px] md:text-[10px] tracking-tight mt-0.5 transition-colors duration-200 ${isActive ? 'font-bold' : 'font-medium text-gray-500'}`}
                  style={{
                    color: isActive ? themeColors.button : '#6B7280',
                  }}
                >
                  {item.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
export default BottomNav;


