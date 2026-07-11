import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PageTransition from '../components/common/PageTransition';
import BottomNav from '../components/layout/BottomNav';
import GlobalBookingAlert from '../components/common/GlobalBookingAlert';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import PublicRoute from '../../../components/auth/PublicRoute';
import LogoLoader from '../../../components/common/LogoLoader';

const lazyLoad = (importFunc) => {
  return lazy(() => {
    return Promise.resolve(importFunc()).catch((error) => {
      console.error('Failed to load worker page:', error);
      return Promise.resolve({
        default: () => (
          <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="text-center p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to load page</h2>
              <p className="text-gray-600 mb-4">Please refresh the page or try again later.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:opacity-90"
                style={{ backgroundColor: '#347989' }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        ),
      });
    });
  });
};

// Eager load Dashboard for instant entryway loading (Rule 2)
import Dashboard from '../pages/Dashboard';

// Lazy load remaining worker pages
const BookingDetails = lazyLoad(() => import('../pages/BookingDetails'));
const BookingTimeline = lazyLoad(() => import('../pages/BookingTimeline'));
const ActiveJobs = lazyLoad(() => import('../pages/ActiveJobs'));
const Profile = lazyLoad(() => import('../pages/Profile'));
const ProfileDetails = lazyLoad(() => import('../pages/Profile/ProfileDetails'));
const EditProfile = lazyLoad(() => import('../pages/Profile/EditProfile'));
const BookingMap = lazyLoad(() => import('../pages/BookingMap'));
const Settings = lazyLoad(() => import('../pages/Settings'));
const Notifications = lazyLoad(() => import('../pages/Notifications'));
const WorkerWallet = lazyLoad(() => import('../pages/Profile/WorkerWallet'));

const LoadingFallback = () => (
  <LogoLoader />
);

const WorkerRoutes = () => {
  const location = useLocation();

  const shouldHideBottomNav = location.pathname.endsWith('/map') ||
    location.pathname.includes('/booking-alert/');

  const shouldShowBottomNav = !shouldHideBottomNav;

  return (
    <ErrorBoundary>
      <div className={shouldShowBottomNav ? "pb-24" : ""}>
        <Suspense fallback={<LoadingFallback />}>
          <PageTransition>
            <Routes>
              {/* Public/Auth routes redirect to vendor login since worker uses the same login page */}
              <Route path="/login" element={<Navigate to="/vendor/login" replace />} />
              <Route path="/signup" element={<Navigate to="/vendor/login" replace />} />

              {/* Protected routes (worker auth required) */}
              <Route path="/" element={<ProtectedRoute userType="worker"><Navigate to="dashboard" replace /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute userType="worker"><Dashboard /></ProtectedRoute>} />
              <Route path="/booking/:id" element={<ProtectedRoute userType="worker"><BookingDetails /></ProtectedRoute>} />
              <Route path="/booking/:id/map" element={<ProtectedRoute userType="worker"><BookingMap /></ProtectedRoute>} />
              <Route path="/booking/:id/timeline" element={<ProtectedRoute userType="worker"><BookingTimeline /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute userType="worker"><ActiveJobs /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute userType="worker"><Profile /></ProtectedRoute>} />
              <Route path="/profile/details" element={<ProtectedRoute userType="worker"><ProfileDetails /></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute userType="worker"><EditProfile /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute userType="worker"><WorkerWallet /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute userType="worker"><Settings /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute userType="worker"><Notifications /></ProtectedRoute>} />
            </Routes>
          </PageTransition>
        </Suspense>
      </div>

      {shouldShowBottomNav && <GlobalBookingAlert />}
      {shouldShowBottomNav && <BottomNav />}
    </ErrorBoundary>
  );
};

export default WorkerRoutes;
