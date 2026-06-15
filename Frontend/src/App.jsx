import React, { useEffect } from 'react'; // Updated index to .jsx
import { BrowserRouter, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';
import { CityProvider } from './context/CityContext';
import { LocationPermissionChecker } from './components/common';
import BidAlertModal from './modules/user/components/booking/BidAlertModal';
import { initializePushNotifications, setupForegroundNotificationHandler } from './services/pushNotificationService';

// Route helper to force light theme on vendor/worker panels
const ThemeRouteManager = () => {
  const location = useLocation();

  useEffect(() => {
    const isVendorOrWorker = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/worker');
    if (isVendorOrWorker) {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
    } else {
      const savedTheme = localStorage.getItem('theme') || 'light';
      if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
      }
    }
  }, [location.pathname]);

  return null;
};

function App() {
  // Initialize push notifications on app load
  useEffect(() => {
    initializePushNotifications();

    // Setup foreground notification handler
    setupForegroundNotificationHandler((payload) => {
      // console.log('📬 Notification received:', payload);

      // Dispatch update events for listening components to refresh UI
      window.dispatchEvent(new Event('vendorJobsUpdated'));
      window.dispatchEvent(new Event('vendorStatsUpdated'));
      window.dispatchEvent(new Event('workerJobsUpdated'));
      window.dispatchEvent(new Event('userBookingsUpdated'));

      // Also dispatch generic one if needed
      window.dispatchEvent(new Event('appNotificationReceived'));
    });
  }, []);

  return (
    <BrowserRouter>
      <ThemeRouteManager />
      <SocketProvider>
        <CityProvider>
          <CartProvider>
            <div className="App">
              <AppRoutes />
              <LocationPermissionChecker />
              <BidAlertModal />
              <Toaster
                position="top-center"
                reverseOrder={false}
                containerStyle={{ zIndex: 999999 }}
                toastOptions={{
                  duration: 2000,
                  style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '12px 20px',
                    zIndex: 999999,
                  },
                  success: {
                    duration: 1000,
                    style: {
                      background: '#10B981',
                      color: '#fff',
                      zIndex: 999999,
                    },
                  },
                  error: {
                    duration: 3000,
                    style: {
                      background: '#EF4444',
                      color: '#fff',
                      zIndex: 999999,
                    },
                  },
                }}
              />
            </div>
          </CartProvider>
        </CityProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
