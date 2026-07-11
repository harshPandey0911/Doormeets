import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LogoLoader from '../components/common/LogoLoader';

// Lazy load module routes — each module only downloads when user navigates to it
const UserRoutes = React.lazy(() => import('../modules/user/routes'));
const VendorRoutes = React.lazy(() => import('../modules/vendor/routes'));
const WorkerRoutes = React.lazy(() => import('../modules/vendor/routes/WorkerRoutes'));
const AdminRoutes = React.lazy(() => import('../modules/admin/routes'));
const ShopRoutes = React.lazy(() => import('../modules/shop/routes'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<LogoLoader />}>
      <Routes>
        {/* Landing Page redirect to user */}
        <Route path="/" element={<Navigate to="/user" replace />} />
        <Route path="/Home" element={<Navigate to="/user" replace />} />

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
    </Suspense>
  );
};

export default AppRoutes;
