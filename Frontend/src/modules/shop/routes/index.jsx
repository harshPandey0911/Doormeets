import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ShopLayout from '../components/ShopLayout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import AddVendor from '../pages/AddVendor';

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
  );
};

export default ShopRoutes;
