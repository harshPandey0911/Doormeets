import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiMapPin, FiClock, FiUser, FiFilter, FiSearch, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import LogoLoader from '../../../../components/common/LogoLoader';

import { getBookings, assignWorker as assignWorkerApi } from '../../services/bookingService';
import { ConfirmDialog } from '../../components/common';

const ActiveJobs = memo(() => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(() => !sessionStorage.getItem('vendor_active_jobs_in_progress_'));
  const [filter, setFilter] = useState('in_progress'); // Default to showing active jobs
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const bgStyle = themeColors.backgroundGradient;

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);

  // Load initial cached jobs for instant 0ms render
  useEffect(() => {
    try {
      const cacheKey = `vendor_active_jobs_${filter}_${searchQuery}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setJobs(parsed);
        setLoading(false);
      }
    } catch (e) {}
  }, [filter, searchQuery]);

  // Memoize loadJobs to prevent recreation
  const loadJobs = useCallback(async (currentFilter, currentSearch) => {
    const cacheKey = `vendor_active_jobs_${currentFilter}_${currentSearch}`;
    const hasCache = !!sessionStorage.getItem(cacheKey);
    try {
      if (!hasCache) setLoading(true);
      const response = await getBookings({
        status: currentFilter,
        q: currentSearch,
        limit: 50
      });
      const jobsData = response.data || [];
      // Map API response to Component State structure
      const mappedJobs = jobsData.map(job => ({
        id: job._id || job.id,
        serviceType: job.serviceName || job.serviceId?.title || 'Service',
        user: {
          name: job.userId?.name || 'Customer'
        },
        location: {
          address: job.address?.addressLine1 || 'Address not available'
        },
        price: (job.vendorEarnings > 0 ? job.vendorEarnings : (job.finalAmount ? job.finalAmount * 0.9 : 0)).toFixed(2),
        status: job.status,
        assignedTo: job.isSelfJob
          ? { name: 'You (Self)' }
          : job.workerId
            ? { name: job.workerId.name, phone: job.workerId.phone }
            : null,
        timeSlot: {
          date: job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : 'Date',
          time: job.scheduledTime || 'Time'
        }
      }));

      sessionStorage.setItem(cacheKey, JSON.stringify(mappedJobs));
      setJobs(mappedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Use a debounced search to avoid spamming the API
  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs(filter, searchQuery);
    }, filter === 'all' && searchQuery === '' ? 0 : 500); // Only debounce if active searching

    return () => clearTimeout(timer);
  }, [filter, searchQuery, loadJobs]);

  useEffect(() => {
    window.addEventListener('vendorJobsUpdated', () => loadJobs(filter, searchQuery));
    return () => {
      window.removeEventListener('vendorJobsUpdated', () => loadJobs(filter, searchQuery));
    };
  }, [loadJobs, filter, searchQuery]);

  // filteredJobs is now just the jobs from the server
  const filteredJobs = jobs;

  const handleAssignToSelf = async (jobId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Assign to Self',
      message: 'Are you sure you want to do this job yourself?',
      onConfirm: async () => {
        try {
          const response = await assignWorkerApi(jobId, 'SELF');
          if (response && response.success) {
            toast.success("Assigned to yourself!");
            // Refresh jobs list instead of full page reload
            loadJobs(filter, searchQuery);
          }
        } catch (error) {
          console.error("Error assigning to self:", error);
          toast.error("Failed to assign to yourself");
        }
      }
    });
  };

  const hexToRgba = useCallback((hex, alpha) => {
    if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  const getStatusColor = useCallback((status) => {
    const colors = {
      'ACCEPTED': '#F59E0B',
      'ASSIGNED': '#3B82F6',
      'JOURNEY_STARTED': '#F59E0B',
      'VISITED': '#8B5CF6',
      'WORK_DONE': '#10B981',
      'WORKER_PAID': '#06B6D4',
      'SETTLEMENT_PENDING': '#F97316',
      'COMPLETED': '#059669',
    };
    return colors[status?.toUpperCase()] || '#6B7280';
  }, []);

  return (
    <div className="min-h-screen pb-20" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Active Jobs" showSearch={false} />

      <main className="px-4 pt-1.5 pb-6">

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'All' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`px-3.5 py-1.5 rounded-md font-bold text-xs whitespace-nowrap transition-all ${filter === filterOption.id
                ? 'text-white'
                : 'bg-white text-gray-700'
                }`}
              style={
                filter === filterOption.id
                  ? {
                    background: themeColors.button,
                    boxShadow: `0 2px 6px ${themeColors.button}33`,
                  }
                  : {
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  }
              }
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-md p-4 border border-slate-100 shadow-xs animate-pulse">
                <div className="flex justify-between mb-3 pb-3 border-b border-slate-50">
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-slate-100 rounded-md"></div>
                    <div className="h-4 w-48 bg-slate-100 rounded-md"></div>
                  </div>
                  <div className="h-8 w-20 bg-slate-100 rounded-md"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-slate-100"></div>
                    <div className="h-3.5 w-32 bg-slate-100 rounded-md"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-slate-100"></div>
                    <div className="h-3.5 w-40 bg-slate-100 rounded-md"></div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 flex gap-2">
                  <div className="h-8 flex-1 bg-slate-100 rounded-md"></div>
                  <div className="h-8 flex-1 bg-slate-100 rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div
            className="bg-white rounded-md p-6 text-center shadow-xs border border-gray-100"
            style={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <FiBriefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-700 font-bold text-sm mb-1">No jobs found</p>
            <p className="text-xs text-gray-500">
              {searchQuery ? 'Try a different search term' : 'No active jobs at the moment'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredJobs.map((job) => {
              const statusColor = getStatusColor(job.status);

              return (
                <div
                  key={job.id}
                  onClick={() => {
                    const isWorker = window.location.pathname.startsWith('/worker') || localStorage.getItem('role') === 'worker';
                    navigate(isWorker ? `/worker/booking/${job.id}` : `/vendor/booking/${job.id}`);
                  }}
                  className="bg-white rounded-md p-3 border border-gray-100 shadow-2xs hover:shadow-xs cursor-pointer active:scale-98 transition-all duration-200 relative overflow-hidden"
                >
                  <div className="relative z-10">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div
                            className="p-1 rounded-md bg-[#E85D3F]/10 text-[#E85D3F]"
                          >
                            <FiBriefcase className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="font-bold text-gray-800 text-xs md:text-sm truncate">{job.serviceType}</h3>
                        </div>
                        <div className="ml-6 mb-1">
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md capitalize border"
                            style={{
                              backgroundColor: `${statusColor}15`,
                              color: statusColor,
                              borderColor: `${statusColor}30`,
                            }}
                          >
                            {job.status.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <div
                        className="px-2 py-1 rounded-md font-bold text-xs md:text-sm flex items-center justify-center min-w-[64px]"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.button}15 0%, ${themeColors.button}10 100%)`,
                          color: themeColors.button,
                          border: `1px solid ${hexToRgba(themeColors.button, 0.15)}`,
                        }}
                      >
                        {job.status?.toLowerCase() === 'completed' ? `₹${job.price}` : <FiClock className="w-3.5 h-3.5 opacity-40" title="Earnings visible after completion" />}
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="p-0.5 rounded-md bg-gray-50">
                          <FiUser className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-gray-600 font-medium text-[11px]">{job.user?.name || 'Customer'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <div className="p-0.5 rounded-md bg-gray-50">
                          <FiMapPin className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-gray-600 font-medium text-[11px] truncate">{job.location?.address || 'Address not available'}</span>
                      </div>

                      {job.assignedTo && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="p-0.5 rounded-md bg-gray-50">
                            <FiUser className="w-3 h-3 text-gray-400" />
                          </div>
                          <span className="text-gray-600 font-medium text-[11px]">
                            Assigned: <span className="font-bold">{job.assignedTo === 'SELF' ? 'Yourself' : job.assignedTo.name}</span>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs">
                        <div className="p-0.5 rounded-md bg-gray-50">
                          <FiClock className="w-3 h-3 text-gray-400" />
                        </div>
                        <span className="text-gray-600 font-medium text-[11px]">{job.timeSlot?.date} • {job.timeSlot?.time}</span>
                      </div>
                    </div>

                    {/* Quick Action Button for Unassigned Jobs */}
                    {['ACCEPTED', 'CONFIRMED'].includes(job.status?.toUpperCase()) && !job.assignedTo && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignToSelf(job.id);
                          }}
                          className="flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          style={{
                            background: 'white',
                            color: themeColors.button,
                            border: `1px solid ${themeColors.button}`,
                          }}
                        >
                          <FiUser className="w-3 h-3" />
                          Do it Myself
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isWorker = window.location.pathname.startsWith('/worker') || localStorage.getItem('role') === 'worker';
                            navigate(isWorker ? `/worker/booking/${job.id}/assign-worker` : `/vendor/booking/${job.id}/assign-worker`);
                          }}
                          className="flex-1 py-1.5 rounded-md text-[11px] font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          style={{
                            background: themeColors.button,
                            boxShadow: `0 1px 4px ${themeColors.button}20`,
                          }}
                        >
                          <FiUser className="w-3 h-3" />
                          Assign Worker
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

      <BottomNav />
    </div>
  );
});

export default ActiveJobs;

