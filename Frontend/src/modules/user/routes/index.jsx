import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/common/PageTransition';
import BottomNav from '../components/layout/BottomNav';
import Footer from '../components/layout/Footer';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import PublicRoute from '../../../components/auth/PublicRoute';
import useAppNotifications from '../../../hooks/useAppNotifications.jsx';
import { ThemeProvider } from '../../../context/ThemeContext';
import { useSocket } from '../../../context/SocketContext';

// Lazy load wrapper with error handling
const lazyLoad = (importFunc) => {
  return lazy(() => {
    return Promise.resolve(importFunc()).catch((error) => {
      console.error('User Module - Lazy Load Error:', error);
      return Promise.resolve({
        default: () => (
          <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-lg w-full border border-red-100">
              <div className="text-5xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Failed to load page</h2>
              <p className="text-gray-600 mb-6">Something went wrong while loading this section.</p>

              <div className="bg-red-50 p-4 rounded-xl text-left border border-red-100 mb-6 max-h-40 overflow-auto">
                <p className="text-xs font-mono text-red-600 underline mb-2">Error Details:</p>
                <code className="text-xs text-red-700 whitespace-pre-wrap">
                  {error?.message || 'Unknown loading error'}
                </code>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-xl text-white font-bold transition-all duration-300 hover:opacity-90 active:scale-95 shadow-lg shadow-teal-500/20"
                  style={{ backgroundColor: '#00a6a6' }}
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 text-gray-400 hover:text-gray-600 font-medium transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        ),
      });
    });
  });
};

// Eager load Home, Welcome, Login, and Signup for instant entryway loading (Rule 2)
import Home from '../pages/Home';
import Welcome from '../pages/Welcome';
import Login from '../pages/login';
import Signup from '../pages/signup';

// Lazy load remaining infrequently used pages
const Rewards = lazyLoad(() => import('../pages/Rewards'));
const Account = lazyLoad(() => import('../pages/Account'));
const Native = lazyLoad(() => import('../pages/Native'));
const Cart = lazyLoad(() => import('../pages/PremiumCartPage'));
const Checkout = lazyLoad(() => import('../pages/Checkout'));
const MyBookings = lazyLoad(() => import('../pages/MyBookings'));
const BookingDetails = lazyLoad(() => import('../pages/BookingDetails'));
const BookingTrack = lazyLoad(() => import('../pages/BookingTrack'));
const BookingConfirmation = lazyLoad(() => import('../pages/BookingConfirmation'));
const Settings = lazyLoad(() => import('../pages/Settings'));
const ManagePaymentMethods = lazyLoad(() => import('../pages/ManagePaymentMethods'));
const ManageAddresses = lazyLoad(() => import('../pages/ManageAddresses'));
const Wallet = lazyLoad(() => import('../pages/Wallet'));
const MyPlan = lazyLoad(() => import('../pages/MyPlan'));
const PlanDetails = lazyLoad(() => import('../pages/MyPlan/PlanDetails'));
const MyRating = lazyLoad(() => import('../pages/MyRating'));
const AboutCleaningExpert = lazyLoad(() => import('../pages/AboutCleaningExpert'));
const UpdateProfile = lazyLoad(() => import('../pages/UpdateProfile'));
const About = lazyLoad(() => import('../pages/About'));
const Contact = lazyLoad(() => import('../pages/Contact'));
const CategoryPage = lazyLoad(() => import('../pages/PremiumCategoryPage'));
const CategoriesPage = lazyLoad(() => import('../pages/PremiumCategoriesPage'));
const BrandPage = lazyLoad(() => import('../pages/PremiumBrandPage'));
const ServiceDetailPage = lazyLoad(() => import('../pages/PremiumServiceDetailPage'));
const Notifications = lazyLoad(() => import('../pages/Notifications'));
const HelpSupport = lazyLoad(() => import('../pages/HelpSupport'));
const CancellationPolicy = lazyLoad(() => import('../pages/CancellationPolicy'));
const PaintingConsultation = lazyLoad(() => import('../pages/PaintingConsultation'));
// Lazy loaded property details screen
const PaintingLayoutDetails = lazyLoad(() => import('../pages/PaintingConsultation/PaintingLayoutDetails'));

// Loading fallback component
import LogoLoader from '../../../components/common/LogoLoader';

const LoadingFallback = () => (
  <LogoLoader />
);

// Import Live Booking Card
import LiveBookingCard from '../components/booking/LiveBookingCard';

const HomeSlugRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/user/category/${slug}`} replace />;
};

const UserRoutes = () => {
  const location = useLocation();
  const socket = useSocket();
  const [resolvedSOSAlert, setResolvedSOSAlert] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleSOSResolved = (data) => {
      console.log('🚨 SOS Alert Resolved received on User side:', data);
      setResolvedSOSAlert(data);
      
      // Play a positive confirmation tone
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.4);
      } catch (e) {}
    };

    socket.on('sos_alert_resolved', handleSOSResolved);
    return () => {
      socket.off('sos_alert_resolved', handleSOSResolved);
    };
  }, [socket]);

  // Pages where BottomNav should be shown
  const bottomNavPages = ['/user/home', '/user/my-bookings', '/user/cart', '/user/account'];
  
  // Normalize path by removing trailing slash (except for root /user)
  const normalizedPath = location.pathname.length > 5 && location.pathname.endsWith('/') 
    ? location.pathname.slice(0, -1) 
    : location.pathname;

  const shouldShowBottomNav = bottomNavPages.includes(normalizedPath) || location.pathname === '/user/home/';

  // Check if we hide the live booking card
  const isBookingDetailsPage = location.pathname.match(/^\/user\/booking\/[a-zA-Z0-9]+(\/track)?$/);
  const isBookingConfirmationPage = location.pathname.includes('/booking-confirmation');

  // Check if we are on public pages
  const isPublicPage = location.pathname.includes('/login') || location.pathname.includes('/signup') || location.pathname === '/user' || location.pathname === '/user/';

  return (
    <ThemeProvider>
      <ErrorBoundary>
        {/* Main content area */}
        <div className={shouldShowBottomNav ? "pb-24" : ""}>
          <Suspense fallback={<LoadingFallback />}>
            <PageTransition>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<PublicRoute userType="user"><Welcome /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute userType="user"><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute userType="user"><Signup /></PublicRoute>} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                {/* Protected routes */}
                <Route path="/home" element={<ProtectedRoute userType="user" allowDesktopGuest={true}><Home /></ProtectedRoute>} />
                <Route path="/home/:slug" element={<ProtectedRoute userType="user" allowDesktopGuest={true}><HomeSlugRedirect /></ProtectedRoute>} />
                <Route path="/native" element={<ProtectedRoute userType="user"><Native /></ProtectedRoute>} />

                <Route path="/rewards" element={<ProtectedRoute userType="user"><Rewards /></ProtectedRoute>} />
                <Route path="/account" element={<ProtectedRoute userType="user"><Account /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute userType="user"><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute userType="user"><Checkout /></ProtectedRoute>} />
                <Route path="/my-bookings" element={<ProtectedRoute userType="user"><MyBookings /></ProtectedRoute>} />
                <Route path="/booking/:id" element={<ProtectedRoute userType="user"><BookingDetails /></ProtectedRoute>} />
                <Route path="/booking/:id/track" element={<ProtectedRoute userType="user"><BookingTrack /></ProtectedRoute>} />
                <Route path="/booking-confirmation/:id" element={<ProtectedRoute userType="user"><BookingConfirmation /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute userType="user"><Settings /></ProtectedRoute>} />
                <Route path="/manage-payment-methods" element={<ProtectedRoute userType="user"><ManagePaymentMethods /></ProtectedRoute>} />
                <Route path="/manage-addresses" element={<ProtectedRoute userType="user"><ManageAddresses /></ProtectedRoute>} />
                <Route path="/wallet" element={<ProtectedRoute userType="user"><Wallet /></ProtectedRoute>} />
                <Route path="/my-plan" element={<ProtectedRoute userType="user"><MyPlan /></ProtectedRoute>} />
                <Route path="/my-plan/:id" element={<ProtectedRoute userType="user"><PlanDetails /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute userType="user" allowDesktopGuest={true}><CategoriesPage /></ProtectedRoute>} />
                <Route path="/category/:slug" element={<ProtectedRoute userType="user" allowDesktopGuest={true}><CategoryPage /></ProtectedRoute>} />
                <Route path="/brand/:slug" element={<ProtectedRoute userType="user" allowDesktopGuest={true}><BrandPage /></ProtectedRoute>} />
                <Route path="/service/:slug" element={<ProtectedRoute userType="user" allowDesktopGuest={true}><ServiceDetailPage /></ProtectedRoute>} />
                <Route path="/my-rating" element={<ProtectedRoute userType="user"><MyRating /></ProtectedRoute>} />
                <Route path="/about-cleaning-expert" element={<ProtectedRoute userType="user"><AboutCleaningExpert /></ProtectedRoute>} />
                <Route path="/update-profile" element={<ProtectedRoute userType="user"><UpdateProfile /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute userType="user"><Notifications /></ProtectedRoute>} />
                <Route path="/help-support" element={<ProtectedRoute userType="user"><HelpSupport /></ProtectedRoute>} />
                <Route path="/cancellation-policy" element={<ProtectedRoute userType="user"><CancellationPolicy /></ProtectedRoute>} />
                <Route path="/painting" element={<ProtectedRoute userType="user"><PaintingConsultation /></ProtectedRoute>} />
                <Route path="/painting/:layoutId" element={<ProtectedRoute userType="user"><PaintingLayoutDetails /></ProtectedRoute>} />
              </Routes>
            </PageTransition>
          </Suspense>
        </div>

        {/* Custom Premium SOS Resolved Slide-down Banner */}
        <AnimatePresence>
          {resolvedSOSAlert && (
            <motion.div
              initial={{ opacity: 0, y: -80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="fixed top-6 left-4 right-4 z-[999999] max-w-sm mx-auto bg-white rounded-3xl p-5 shadow-[0_20px_40px_rgba(6,95,70,0.15)] border border-emerald-200 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold animate-pulse">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Emergency Status</p>
                  <h4 className="text-sm font-black text-gray-800 tracking-tight">SOS Alert Resolved</h4>
                </div>
                <button 
                  onClick={() => setResolvedSOSAlert(null)}
                  className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-3.5">
                <p className="text-[9px] text-emerald-800/80 font-semibold mb-1 uppercase tracking-widest">Resolution Update</p>
                <p className="text-xs text-gray-700 font-bold leading-relaxed">{resolvedSOSAlert.notes || 'Our emergency response team has confirmed that you are safe.'}</p>
              </div>

              <button
                onClick={() => setResolvedSOSAlert(null)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-600/15"
              >
                I am Safe
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Components OUTSIDE Suspense */}
        {!isBookingDetailsPage && !isBookingConfirmationPage && !isPublicPage && <LiveBookingCard hasBottomNav={shouldShowBottomNav} />}
        {shouldShowBottomNav && <BottomNav />}
        {(location.pathname === '/user/home' || 
          location.pathname === '/user/home/' || 
          location.pathname === '/user/about' || 
          location.pathname === '/user/contact' || 
          location.pathname.startsWith('/user/category/') || 
          location.pathname.startsWith('/user/brand/') || 
          location.pathname.startsWith('/user/service/')) && <Footer />}
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default UserRoutes;
