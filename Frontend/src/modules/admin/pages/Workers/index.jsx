import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import AllWorkers from './AllWorkers';
import WorkerJobs from './WorkerJobs';
import WorkerAnalytics from './WorkerAnalytics';
import WorkerPayments from '../Payments/WorkerPayments';

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
          <Route path="/" element={<Navigate to="/admin/workers/all" replace />} />
          <Route path="all" element={<AllWorkers />} />
          <Route path="jobs" element={<WorkerJobs />} />
          <Route path="analytics" element={<WorkerAnalytics />} />
          <Route path="payments" element={<WorkerPayments />} />
          <Route path="*" element={<Navigate to="/admin/workers/all" replace />} />
        </Routes>
      </motion.div>
    </div>
  );
};

export default Workers;
