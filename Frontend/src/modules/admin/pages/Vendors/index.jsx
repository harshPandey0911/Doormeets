import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiBriefcase,
  FiActivity,
  FiDollarSign,
  FiChevronRight,
  FiMapPin,
  FiAlertTriangle
} from 'react-icons/fi';

// Import sub-components
import AllVendors from './AllVendors';
import VendorBookings from './VendorBookings';
import VendorAnalytics from './VendorAnalytics';
import IncentivesPage from './IncentivesPage';
import VendorsZone from '../VendorsZone';
import ManualAssignment from './ManualAssignment';

const Vendors = () => {
  const location = useLocation();

  const navTabs = [
    { name: 'All Vendors', path: '/admin/vendors/all', icon: FiUsers },
    { name: "Vendor's Zone", path: '/admin/vendors/zone', icon: FiMapPin },
    { name: 'Manual Assignment', path: '/admin/vendors/manual', icon: FiAlertTriangle },
    { name: 'Vendor Bookings', path: '/admin/vendors/bookings', icon: FiBriefcase },
    { name: 'Vendor Analytics', path: '/admin/vendors/analytics', icon: FiActivity },
  ];

  const getPageTitle = () => {
    const currentTab = navTabs.find(tab => location.pathname === tab.path);
    return currentTab ? currentTab.name : 'Vendor Management';
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation header */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 flex-wrap">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-150 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* Page Content */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="all" replace />} />
          <Route path="all" element={<AllVendors />} />
          <Route path="zone" element={<VendorsZone />} />
          <Route path="manual" element={<ManualAssignment />} />
          <Route path="bookings" element={<VendorBookings />} />
          <Route path="analytics" element={<VendorAnalytics />} />
          <Route path="incentives" element={<IncentivesPage />} />
        </Routes>
      </motion.div>
    </div>
  );
};

export default Vendors;
