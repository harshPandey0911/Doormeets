import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiGift, FiShoppingCart, FiUser, FiTrash2, FiCalendar, FiShoppingBag, FiGrid } from 'react-icons/fi';
import { HiHome, HiGift, HiShoppingCart, HiUser, HiTrash, HiCalendar, HiViewGrid } from 'react-icons/hi';
import { FaHardHat } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../../context/CartContext';

// Colorful theme for each nav item
const navItemColors = {
  home: {
    primary: '#B33A35', // Orange
    gradient: 'linear-gradient(135deg, #B33A35 0%, #9E2E2A 100%)',
    bg: 'rgba(255, 159, 69, 0.1)',
    shadow: 'rgba(255, 159, 69, 0.4)'
  },
  categories: {
    primary: '#B33A35', // Orange
    gradient: 'linear-gradient(135deg, #B33A35 0%, #9E2E2A 100%)',
    bg: 'rgba(255, 159, 69, 0.1)',
    shadow: 'rgba(255, 159, 69, 0.4)'
  },
  bookings: {
    primary: '#B33A35', // Orange
    gradient: 'linear-gradient(135deg, #B33A35 0%, #9E2E2A 100%)',
    bg: 'rgba(255, 159, 69, 0.1)',
    shadow: 'rgba(255, 159, 69, 0.4)'
  },
  scrap: {
    primary: '#B33A35', // Orange
    gradient: 'linear-gradient(135deg, #B33A35 0%, #9E2E2A 100%)',
    bg: 'rgba(255, 159, 69, 0.1)',
    shadow: 'rgba(255, 159, 69, 0.4)'
  },
  cart: {
    primary: '#B33A35', // Orange
    gradient: 'linear-gradient(135deg, #B33A35 0%, #9E2E2A 100%)',
    bg: 'rgba(255, 159, 69, 0.1)',
    shadow: 'rgba(255, 159, 69, 0.4)'
  },
  account: {
    primary: '#B33A35', // Orange
    gradient: 'linear-gradient(135deg, #B33A35 0%, #9E2E2A 100%)',
    bg: 'rgba(255, 159, 69, 0.1)',
    shadow: 'rgba(255, 159, 69, 0.4)'
  },
};

const BottomNav = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const { cartCount } = useCart();
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const navItems = useMemo(() => [
    { id: 'home', label: 'Home', icon: FiHome, filledIcon: HiHome, path: '/user/home' },
    // { id: 'categories', label: 'Category', icon: FiGrid, filledIcon: HiViewGrid, path: '/user/categories' },
    { id: 'bookings', label: 'Bookings', icon: FiCalendar, filledIcon: HiCalendar, path: '/user/my-bookings' },
    { id: 'cart', label: 'Cart', icon: FiShoppingCart, filledIcon: HiShoppingCart, path: '/user/cart', isCart: true },
    { id: 'account', label: 'Account', icon: FiUser, filledIcon: HiUser, path: '/user/account' },
  ], []);

  const getActiveTab = () => {
    if (location.pathname === '/user/home' || location.pathname === '/user/home/') return 'home';
    if (location.pathname === '/user/categories') return 'categories';
    if (location.pathname === '/user/my-bookings') return 'bookings';
    if (location.pathname === '/user/cart') return 'cart';
    if (location.pathname === '/user/account') return 'account';
    return 'home';
  };

  const activeTab = getActiveTab();
  const activeIndex = navItems.findIndex(item => item.id === activeTab);
  const activeColor = navItemColors[activeTab];



  // Update indicator position when active tab changes
  useEffect(() => {
    if (navRef.current) {
      const buttons = navRef.current.querySelectorAll('button');
      if (buttons[activeIndex]) {
        const button = buttons[activeIndex];
        const navRect = navRef.current.getBoundingClientRect();
        const buttonRect = button.getBoundingClientRect();

        setIndicatorStyle({
          left: buttonRect.left - navRect.left + (buttonRect.width / 2) - 16, // Center the 32px indicator
          width: 32
        });
      }
    }
  }, [activeIndex, activeTab]);

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 w-full lg:hidden"
      style={{
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <div
        className="w-full pb-6 pt-3 px-4 rounded-t-[24px]"
        style={{
          background: 'var(--background)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.15)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 24px))',
        }}
      >
        <div ref={navRef} className="flex items-center justify-between max-w-md mx-auto relative gap-1.5">
          {navItems.map((item) => {
            const IconComponent = activeTab === item.id ? item.filledIcon : item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleTabClick(item.path)}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center justify-center transition-all duration-300 relative cursor-pointer ${
                  isActive
                    ? 'bg-[#B33A35] text-white px-3.5 py-2 rounded-full flex-1 max-w-[135px]'
                    : 'w-10 h-10 rounded-full flex-shrink-0'
                }`}
                style={isActive ? {} : {
                  backgroundColor: 'rgba(179,58,53,0.12)',
                  color: 'var(--primary)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <IconComponent className="w-5 h-5" />
                    {item.isCart && cartCount > 0 && (
                      <span
                        className={`absolute -top-2 -right-3 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center border-2 ${
                          isActive ? 'border-[#B33A35]' : 'border-white'
                        }`}
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <span className="text-xs font-semibold whitespace-nowrap">
                      {item.id === 'cart' ? 'My cart' : item.id === 'account' ? 'Profile' : item.label}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
