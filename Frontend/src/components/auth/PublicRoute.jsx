import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */
const PublicRoute = ({ children, userType = 'user', redirectTo = null }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      let tokenKey = 'accessToken';
      let refreshTokenKey = 'refreshToken';
      let dataKey = 'userData';

      // Determine keys based on userType
      switch (userType) {
        case 'vendor':
          tokenKey = 'vendorAccessToken';
          refreshTokenKey = 'vendorRefreshToken';
          dataKey = 'vendorData';
          break;
        case 'worker':
          tokenKey = 'workerAccessToken';
          refreshTokenKey = 'workerRefreshToken';
          dataKey = 'workerData';
          break;
        case 'admin':
          tokenKey = 'adminAccessToken';
          refreshTokenKey = 'adminRefreshToken';
          dataKey = 'adminData';
          break;
        case 'user':
        default:
          tokenKey = 'accessToken';
          refreshTokenKey = 'refreshToken';
          dataKey = 'userData';
          break;
      }

      const token = sessionStorage.getItem(tokenKey) || localStorage.getItem(tokenKey);
      const refreshToken = sessionStorage.getItem(refreshTokenKey) || localStorage.getItem(refreshTokenKey);
      const userData = sessionStorage.getItem(dataKey) || localStorage.getItem(dataKey);

      if (token || refreshToken) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [userType]); // ✅ Only re-run if userType changes, NOT on every route change

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00a6a6' }}></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Determine redirect path
    const defaultRedirects = {
      user: '/user/home',
      vendor: '/vendor/dashboard',
      worker: '/worker/dashboard',
      admin: '/admin/dashboard'
    };

    const redirectPath = redirectTo || defaultRedirects[userType] || '/user/home';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default PublicRoute;

