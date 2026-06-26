import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import PublicRoute from '../../../components/auth/PublicRoute';
import SuperAdminRoute from '../components/auth/SuperAdminRoute';
import useAppNotifications from '../../../hooks/useAppNotifications.jsx';
import LogoLoader from '../../../components/common/LogoLoader';

// Login page (not lazy loaded for faster initial access)
import Login from '../pages/login';

// Lazy load admin pages for code splitting
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Settings = lazy(() => import('../pages/Settings'));
const UserCategories = lazy(() => import('../pages/UserCategories'));
const Users = lazy(() => import('../pages/Users'));
const Vendors = lazy(() => import('../pages/Vendors'));
const Workers = lazy(() => import('../pages/Workers'));
const VendorsZone = lazy(() => import('../pages/VendorsZone'));
const Bookings = lazy(() => import('../pages/Bookings'));
const BookingDetails = lazy(() => import('../pages/Bookings/BookingDetails'));
const BookingTracking = lazy(() => import('../pages/Bookings/Tracking'));
const BookingNotifications = lazy(() => import('../pages/Bookings/BookingNotifications'));
const Payments = lazy(() => import('../pages/Payments'));
const Reports = lazy(() => import('../pages/Reports'));
const Notifications = lazy(() => import('../pages/Notifications'));
const AdminSupport = lazy(() => import('../pages/Support/index'));
const SOSAlerts = lazy(() => import('../pages/SOSAlerts'));
const OfferBanners = lazy(() => import('../pages/OfferBanners'));
const Plans = lazy(() => import('../pages/Plans/Plans'));
const Settlements = lazy(() => import('../pages/Settlements'));
const Reviews = lazy(() => import('../pages/Reviews'));
const VendorSubscriptionManagement = lazy(() => import('../pages/VendorSubscriptions/SubscriptionManagement'));
const Training = lazy(() => import('../pages/Training'));
const VendorRequests = lazy(() => import('../pages/VendorRequests'));
const AdminManagement = lazy(() => import('../pages/AdminManagement'));
const PoliceVerification = lazy(() => import('../pages/PoliceVerification'));
const Commission = lazy(() => import('../pages/Commission'));
const PromoManagement = lazy(() => import('../pages/PromoManagement'));
const VoucherManagement = lazy(() => import('../pages/VoucherManagement'));
const PackageBased = lazy(() => import('../pages/PackageBased'));
const PaintingManagement = lazy(() => import('../pages/Painting'));



// Loading fallback component
const LoadingFallback = () => (
  <LogoLoader />
);

const AdminRoutes = () => {
  // Enable global notifications for admin
  // Global notifications are now handled by SocketProvider at App level
  // useAppNotifications('admin');

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Login route - outside of layout (public) */}
        <Route path="/login" element={<PublicRoute userType="admin"><Login /></PublicRoute>} />

        {/* Protected routes - inside layout */}
        <Route path="/" element={
          <ProtectedRoute userType="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="management" element={<Navigate to="/admin/user-categories/templates/MINUTE_BASED/manage" replace />} />
          <Route path="users/*" element={<Users />} />
          <Route path="vendors/*" element={<Vendors />} />
          <Route path="vendors-zone" element={<VendorsZone />} />
          <Route path="vendor-subscriptions/*" element={<VendorSubscriptionManagement />} />
          <Route path="workers/*" element={<Workers />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/:id" element={<BookingDetails />} />
          <Route path="bookings/tracking" element={<BookingTracking />} />
          <Route path="bookings/notifications" element={<BookingNotifications />} />
          <Route path="user-categories/*" element={<UserCategories />} />
          <Route path="payments/*" element={<Payments />} />
          <Route path="reports/*" element={<Reports />} />
          <Route path="notifications/*" element={<Notifications />} />
          <Route path="plans" element={<Plans />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settlements/*" element={<Settlements />} />
          <Route path="settings/*" element={<Settings />} />
          <Route path="support/*" element={<AdminSupport />} />
          <Route path="sos-alerts" element={<SOSAlerts />} />
          <Route path="offer-banners" element={<OfferBanners />} />
          <Route path="training" element={<Training />} />
          <Route path="vendor-requests" element={<VendorRequests />} />
          <Route path="promos" element={<PromoManagement />} />
          <Route path="vouchers" element={<VoucherManagement />} />
          <Route path="package-based" element={<PackageBased />} />
          <Route path="painting" element={<PaintingManagement />} />
          <Route path="vendors/police-verification" element={
            <SuperAdminRoute><PoliceVerification /></SuperAdminRoute>
          } />
          <Route path="commission" element={<Commission />} />
          <Route path="admin-management/*" element={
            <SuperAdminRoute><AdminManagement /></SuperAdminRoute>
          } />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;

