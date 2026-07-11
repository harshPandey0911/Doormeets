import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PageTransition from '../components/common/PageTransition';
import BottomNav from '../components/layout/BottomNav';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import PublicRoute from '../../../components/auth/PublicRoute';
import CashLimitModal from '../components/common/CashLimitModal'; // Import
import GlobalBookingAlert from '../components/common/GlobalBookingAlert';
import LogoLoader from '../../../components/common/LogoLoader';
// import useAppNotifications from '../../../hooks/useAppNotifications.jsx'; // Handled globally

// Lazy load wrapper with error handling (same as user app)
const lazyLoad = (importFunc) => {
  return lazy(() => {
    return Promise.resolve(importFunc()).catch((error) => {
      console.error('Failed to load vendor page:', error);
      // Return a fallback component wrapped in a Promise
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

// Eager load Login, Signup, and Dashboard for instant entryway loading (Rule 2)
import Login from '../pages/login';
import Signup from '../pages/signup';
import Dashboard from '../pages/Dashboard';

// Lazy load remaining vendor pages
const PendingApproval = lazyLoad(() => import('../pages/PendingApproval'));
const SubscriptionSelection = lazyLoad(() => import('../pages/Subscription/SubscriptionSelection'));
const VerificationPage = lazyLoad(() => import('../pages/VerificationPage'));
const BookingAlert = lazyLoad(() => import('../pages/BookingAlert'));
const BookingAlerts = lazyLoad(() => import('../pages/BookingAlerts'));
const BookingDetails = lazyLoad(() => import('../pages/BookingDetails'));
const BookingTimeline = lazyLoad(() => import('../pages/BookingTimeline'));
const ActiveJobs = lazyLoad(() => import('../pages/ActiveJobs'));
const WorkersList = lazyLoad(() => import('../pages/WorkersList'));
const AddEditWorker = lazyLoad(() => import('../pages/AddEditWorker'));
const AssignWorker = lazyLoad(() => import('../pages/AssignWorker'));
const Earnings = lazyLoad(() => import('../pages/Earnings'));
const Wallet = lazyLoad(() => import('../pages/Wallet'));
const WithdrawalRequest = lazyLoad(() => import('../pages/WithdrawalRequest'));
const Profile = lazyLoad(() => import('../pages/Profile'));
const ProfileDetails = lazyLoad(() => import('../pages/Profile/ProfileDetails'));
const EditProfile = lazyLoad(() => import('../pages/Profile/EditProfile'));
const BookingMap = lazyLoad(() => import('../pages/BookingMap'));
const Settings = lazyLoad(() => import('../pages/Settings'));
const AddressManagement = lazyLoad(() => import('../pages/AddressManagement'));
const Notifications = lazyLoad(() => import('../pages/Notifications'));
const SettlementRequest = lazyLoad(() => import('../pages/Wallet/SettlementRequest'));
const SettlementHistory = lazyLoad(() => import('../pages/Wallet/SettlementHistory'));
const MyRatings = lazyLoad(() => import('../pages/MyRatings'));
const AboutCleaningExpert = lazyLoad(() => import('../pages/AboutCleaningExpert'));

// Training module lazy loading
const Training = lazyLoad(() => import('../pages/Training'));
const MCQTest = lazyLoad(() => import('../pages/Training/MCQTest'));
const TrainingResult = lazyLoad(() => import('../pages/Training/TrainingResult'));

const BillingPage = lazyLoad(() => import('../pages/BillingPage'));
const SupportList = lazyLoad(() => import('../pages/Support/index'));
const TicketDetails = lazyLoad(() => import('../pages/Support/TicketDetails'));
const MyServices = lazyLoad(() => import('../pages/MyServices'));
const Categories = lazyLoad(() => import('../pages/Categories'));
const Products = lazyLoad(() => import('../pages/Products'));
const StockManagement = lazyLoad(() => import('../pages/Stock'));
const CategoryDetail = lazyLoad(() => import('../pages/Categories/CategoryDetail'));
const PaintingConsultations = lazyLoad(() => import('../pages/PaintingConsultation'));

// Loading fallback component
const LoadingFallback = () => (
  <LogoLoader />
);

const VendorRoutes = () => {
  const location = useLocation();

  // Check if current route should hide bottom nav (auth routes or map)
  const shouldHideBottomNav = location.pathname === '/vendor/login' ||
    location.pathname === '/vendor/signup' ||
    location.pathname === '/vendor/verification' ||
    location.pathname === '/vendor/pending-approval' ||
    location.pathname === '/vendor/subscription' ||
    location.pathname.endsWith('/map') ||
    location.pathname.includes('/booking-alert/');

  const shouldShowBottomNav = !shouldHideBottomNav;

  return (
    <ErrorBoundary>
      {/* Main content area - leaves space for bottom nav when needed */}
      <div className={shouldShowBottomNav ? "pb-24" : ""}>
        <Suspense fallback={<LoadingFallback />}>
          <PageTransition>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<PublicRoute userType="vendor"><Login /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute userType="vendor"><Signup /></PublicRoute>} />
              <Route path="pending-approval" element={<PendingApproval />} />
              <Route path="subscription" element={<SubscriptionSelection />} />
              <Route path="verification" element={<ProtectedRoute userType="vendor"><VerificationPage /></ProtectedRoute>} />

              {/* Protected routes (auth required) */}
              <Route path="/" element={<ProtectedRoute userType="vendor"><Navigate to="dashboard" replace /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute userType="vendor"><Dashboard /></ProtectedRoute>} />
              <Route path="/booking-alerts" element={<ProtectedRoute userType="vendor"><BookingAlerts /></ProtectedRoute>} />
              <Route path="/booking-alert/:id" element={<ProtectedRoute userType="vendor"><BookingAlert /></ProtectedRoute>} />
              <Route path="/booking/:id" element={<ProtectedRoute userType="vendor"><BookingDetails /></ProtectedRoute>} />
              <Route path="/booking/:id/map" element={<ProtectedRoute userType="vendor"><BookingMap /></ProtectedRoute>} />
              <Route path="/booking/:id/billing" element={<ProtectedRoute userType="vendor"><BillingPage /></ProtectedRoute>} />
              <Route path="/booking/:id/timeline" element={<ProtectedRoute userType="vendor"><BookingTimeline /></ProtectedRoute>} />
              <Route path="/jobs" element={<ProtectedRoute userType="vendor"><ActiveJobs /></ProtectedRoute>} />
              <Route path="/workers" element={<ProtectedRoute userType="vendor"><WorkersList /></ProtectedRoute>} />
              <Route path="/workers/add" element={<ProtectedRoute userType="vendor"><AddEditWorker /></ProtectedRoute>} />
              <Route path="/workers/:id/edit" element={<ProtectedRoute userType="vendor"><AddEditWorker /></ProtectedRoute>} />
              <Route path="/booking/:id/assign-worker" element={<ProtectedRoute userType="vendor"><AssignWorker /></ProtectedRoute>} />
              <Route path="/earnings" element={<ProtectedRoute userType="vendor"><Earnings /></ProtectedRoute>} />
              <Route path="/wallet" element={<ProtectedRoute userType="vendor"><Wallet /></ProtectedRoute>} />
              <Route path="/wallet/withdraw" element={<ProtectedRoute userType="vendor"><WithdrawalRequest /></ProtectedRoute>} />
              <Route path="/wallet/settle" element={<ProtectedRoute userType="vendor"><SettlementRequest /></ProtectedRoute>} />
              <Route path="/wallet/settlements" element={<ProtectedRoute userType="vendor"><SettlementHistory /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute userType="vendor"><Profile /></ProtectedRoute>} />
              <Route path="/profile/details" element={<ProtectedRoute userType="vendor"><ProfileDetails /></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute userType="vendor"><EditProfile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute userType="vendor"><Settings /></ProtectedRoute>} />
              <Route path="/address-management" element={<ProtectedRoute userType="vendor"><AddressManagement /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute userType="vendor"><Notifications /></ProtectedRoute>} />
              <Route path="/my-ratings" element={<ProtectedRoute userType="vendor"><MyRatings /></ProtectedRoute>} />
              <Route path="/about-cleaning-expert" element={<ProtectedRoute userType="vendor"><AboutCleaningExpert /></ProtectedRoute>} />
              <Route path="/my-services" element={<ProtectedRoute userType="vendor"><MyServices /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute userType="vendor"><Categories /></ProtectedRoute>} />
              <Route path="/categories/:categoryId" element={<ProtectedRoute userType="vendor"><CategoryDetail /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute userType="vendor"><Categories /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute userType="vendor"><SupportList /></ProtectedRoute>} />
              <Route path="/support/:id" element={<ProtectedRoute userType="vendor"><TicketDetails /></ProtectedRoute>} />
              <Route path="/stock" element={<ProtectedRoute userType="vendor"><StockManagement /></ProtectedRoute>} />
              <Route path="/painting-consultations" element={<ProtectedRoute userType="vendor"><PaintingConsultations /></ProtectedRoute>} />

              {/* Training Routes */}
              <Route path="/training" element={<ProtectedRoute userType="vendor"><Training /></ProtectedRoute>} />
              <Route path="/training/test" element={<ProtectedRoute userType="vendor"><MCQTest /></ProtectedRoute>} />
              <Route path="/training/result" element={<ProtectedRoute userType="vendor"><TrainingResult /></ProtectedRoute>} />
            </Routes>
          </PageTransition>
        </Suspense>
      </div>

      {/* BottomNav is OUTSIDE Suspense so it persists during page loads */}
      {shouldShowBottomNav && <BottomNav />}

      {/* Global Alert for Cash Limit */}
      {!shouldHideBottomNav && <CashLimitModal />}

      {/* Global New Booking Alert Modal */}
      {!shouldHideBottomNav && <GlobalBookingAlert />}
    </ErrorBoundary>
  );
};

export default VendorRoutes;

