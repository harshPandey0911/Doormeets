import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ShopLayout from '../components/ShopLayout';
import LogoLoader from '../../../components/common/LogoLoader';
import Dashboard from '../pages/Dashboard';

// Lazy load shop pages for code splitting
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const AddVendor = lazy(() => import('../pages/AddVendor'));

// Loading fallback
const LoadingFallback = () => (
  <LogoLoader />
);

// Custom Protected Route for Shop Owner
const ProtectedShopRoute = ({ children }) => {
  const token = localStorage.getItem('shopAccessToken');
  if (!token) {
    return <Navigate to="/shop/login" replace />;
  }
  return children;
};

// Custom Public Route for Login/Register (prevents logged-in shop owners from seeing login)
const PublicShopRoute = ({ children }) => {
  const token = localStorage.getItem('shopAccessToken');
  if (token) {
    return <Navigate to="/shop/dashboard" replace />;
  }
  return children;
};

const ShopRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={
          <PublicShopRoute>
            <Login />
          </PublicShopRoute>
        } />
        <Route path="/register" element={
          <PublicShopRoute>
            <Register />
          </PublicShopRoute>
        } />
        
        <Route path="/" element={
          <ProtectedShopRoute>
            <ShopLayout />
          </ProtectedShopRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="add-vendor" element={<AddVendor />} />
        </Route>

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default ShopRoutes;
