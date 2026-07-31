import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/adminHelpers';

const TopServices = ({ bookings = [], periodLabel = 'Top Services', itemsPerPage = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const topServices = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => {
      const name = b.serviceType || 'Unknown Service';
      const prev = map.get(name) || { name, bookings: 0, revenue: 0, completed: 0 };
      prev.bookings += 1;
      if ((b.status || '').toUpperCase() === 'COMPLETED') {
        prev.revenue += Number(b.price || 0);
        prev.completed += 1;
      }
      map.set(name, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.bookings - a.bookings);
  }, [bookings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [bookings.length, periodLabel]);

  const totalPages = Math.ceil(topServices.length / itemsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return topServices.slice(start, start + itemsPerPage);
  }, [topServices, currentPage, itemsPerPage]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">{periodLabel}</h3>
          {topServices.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
              Total: {topServices.length}
            </span>
          )}
        </div>
        <div className="space-y-4">
          {paginated.map((svc, index) => {
            const globalIndex = (currentPage - 1) * itemsPerPage + index;
            return (
              <motion.div
                key={svc.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold flex-shrink-0">
                    {globalIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 truncate">{svc.name}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600">{svc.bookings} bookings</span>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {svc.completed} completed
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-bold text-gray-800">{formatCurrency(svc.revenue)}</p>
                  <p className="text-xs text-gray-500">Revenue (completed)</p>
                </div>
              </motion.div>
            );
          })}
          {topServices.length === 0 && <p className="text-gray-500 text-sm">No data found.</p>}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span>-
            <span className="font-semibold text-gray-800">
              {Math.min(currentPage * itemsPerPage, topServices.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{topServices.length}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopServices;


