import React from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiSettings } from 'react-icons/fi';
import AllShopOwners from './AllShopOwners';
import ShopReferralSettings from './ShopReferralSettings';

const ShopOwnersIndex = () => {
  const location = useLocation();

  const navTabs = [
    { name: 'All Shop Owners', path: '/admin/shop-owners/all', icon: FiUsers },
    { name: 'Referral Settings', path: '/admin/shop-owners/referrals', icon: FiSettings }
  ];

  const getPageTitle = () => {
    const currentTab = navTabs.find(tab => location.pathname === tab.path);
    return currentTab ? currentTab.name : 'Shop Owner Management';
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{getPageTitle()}</h1>
            <p className="text-xs text-gray-400 mt-1">Manage shop owners, onboarding stats, and referral configuration.</p>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 gap-1 overflow-x-auto">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const active = location.pathname === tab.path || (tab.path === '/admin/shop-owners/all' && location.pathname === '/admin/shop-owners');
              return (
                <Link
                  key={tab.name}
                  to={tab.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-100/50'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="all" replace />} />
          <Route path="all" element={<AllShopOwners />} />
          <Route path="referrals" element={<ShopReferralSettings />} />
          <Route path="*" element={<Navigate to="all" replace />} />
        </Routes>
      </motion.div>
    </div>
  );
};

export default ShopOwnersIndex;
