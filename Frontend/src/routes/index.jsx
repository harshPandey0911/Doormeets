import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import module routes
import UserRoutes from '../modules/user/routes';
import VendorRoutes from '../modules/vendor/routes';
import WorkerRoutes from '../modules/vendor/routes/WorkerRoutes';
import AdminRoutes from '../modules/admin/routes';
import ShopRoutes from '../modules/shop/routes';

import LandingPage from '../modules/landing/pages/LandingPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/Home" element={<LandingPage />} />

      {/* Redirect Root Slash to User App */}
      <Route path="/" element={<Navigate to="/user" replace />} />

      {/* User Routes */}
      <Route path="/user/*" element={<UserRoutes />} />

      {/* Vendor Routes */}
      <Route path="/vendor/*" element={<VendorRoutes />} />

      {/* Worker Routes */}
      <Route path="/worker/*" element={<WorkerRoutes />} />

      {/* Admin Routes */}
      <Route path="/admin/*" element={<AdminRoutes />} />

      {/* Shop Owner Routes */}
      <Route path="/shop/*" element={<ShopRoutes />} />
    </Routes>
  );
};

export default AppRoutes;
