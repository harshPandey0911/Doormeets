import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Protected Route Component
 * Checks if user is authenticated before allowing access
 */
const ProtectedRoute = ({ children, userType = 'user', redirectTo = null }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      let tokenKey = 'accessToken';

      switch (userType) {
        case 'vendor':
          tokenKey = 'vendorAccessToken';
          break;
        case 'worker':
          tokenKey = 'workerAccessToken';
          break;
        case 'admin':
          tokenKey = 'adminAccessToken';
          break;
        case 'user':
        default:
          tokenKey = 'accessToken';
          break;
      }

      const token = sessionStorage.getItem(tokenKey) || localStorage.getItem(tokenKey);

      // ✅ Agar koi bhi token hai (expired bhi), andar jaane do.
      // Axios interceptor refresh handle karega.
      // Sirf tab block karo jab token bilkul nahi ho (never logged in / manual logout).
      if (token) {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [userType]); // ✅ Only re-run if userType changes, NOT on every route change

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00a6a6' }}></div>
          <p className="text-gray-600 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    // Determine redirect path
    const defaultRedirects = {
      user: '/user',
      vendor: '/vendor/login',
      worker: '/worker/login',
      admin: '/admin/login'
    };

    const redirectPath = redirectTo || defaultRedirects[userType] || '/user';

    // Toast removed from render phase to prevent "Cannot update a component while rendering" error
    // If you need a toast, trigger it in useEffect before setting isAuthenticated(false) or rely on LoginPage to show "Please login"

    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Prevent pending vendors from accessing routes other than verification
  if (userType === 'vendor' && isAuthenticated) {
    try {
      const vendorData = JSON.parse(localStorage.getItem('vendorData') || '{}');
      if (vendorData.approvalStatus?.toLowerCase() === 'pending' && !location.pathname.includes('/verification')) {
        return <Navigate to="/vendor/verification" replace />;
      }
    } catch (e) {
      // vendorData might be corrupted (e.g., "undefined" string) — skip the check
      console.warn('ProtectedRoute: Failed to parse vendorData:', e.message);
    }
  }

  return children;
};

export default ProtectedRoute;

