import React from 'react';
import WorkerReport from '../Reports/WorkerReport';

const WorkerAnalytics = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Worker Analytics & Performance</h2>
          <p className="text-xs text-gray-500">Monitor approval states, rating distributions, and top worker performance metrics.</p>
        </div>
      </div>
      <WorkerReport />
    </div>
  );
};

export default WorkerAnalytics;
