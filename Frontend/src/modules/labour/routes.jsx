import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LabourLogin from './pages/LabourLogin';
import LabourRegister from './pages/LabourRegister';
import LabourDashboard from './pages/LabourDashboard';
import LabourList from './pages/LabourList';

const LabourRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/labour/login" replace />} />
      <Route path="/login" element={<LabourLogin />} />
      <Route path="/register" element={<LabourRegister />} />
      <Route path="/dashboard" element={<LabourDashboard />} />
      <Route path="/list" element={<LabourList />} />
    </Routes>
  );
};

export default LabourRoutes;
