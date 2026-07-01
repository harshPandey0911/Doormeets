import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AllWorkers from './AllWorkers';

const Workers = () => {
  const location = useLocation();

  return (
    <div className="space-y-6">
      {/* Content Area */}
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="all" replace />} />
          <Route path="all" element={<AllWorkers />} />
          <Route path="*" element={<Navigate to="all" replace />} />
        </Routes>
      </motion.div>
    </div>
  );
};

export default Workers;
