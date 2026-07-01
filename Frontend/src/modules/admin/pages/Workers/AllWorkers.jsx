import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiUser, FiPhone, FiMail, FiCheckCircle, FiSlash, FiCheck, FiTrash2, FiBriefcase, FiXCircle, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import adminWorkerService from '../../../../services/adminWorkerService';

const AllWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [typeFilter, setTypeFilter] = useState('all'); // all, worker, labour
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWorkers, setTotalWorkers] = useState(0);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: debouncedSearch,
        type: typeFilter !== 'all' ? typeFilter : undefined
      };

      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active';
      }

      const response = await adminWorkerService.getAllWorkers(params);
      if (response.success) {
        setWorkers(response.data || []);
        setTotalPages(response.pagination?.pages || 1);
        setTotalWorkers(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [page, debouncedSearch, statusFilter, typeFilter]);

  const handleStatusToggle = async (workerId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'block' : 'activate'} this worker?`)) {
      return;
    }

    try {
      const response = await adminWorkerService.toggleStatus(workerId, !currentStatus);
      if (response.success) {
        toast.success(response.message || 'Worker status updated successfully');
        setWorkers(workers.map(worker =>
          worker._id === workerId ? { ...worker, isActive: !currentStatus } : worker
        ));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update worker status');
    }
  };

  const handleDeleteWorker = async (workerId) => {
    if (!window.confirm('Are you sure you want to delete this worker? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminWorkerService.deleteWorker(workerId);
      if (response.success) {
        toast.success(response.message || 'Worker deleted successfully');
        fetchWorkers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete worker');
    }
  };

  const handleApprovalAction = async (workerId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this worker's registration?`)) {
      return;
    }

    try {
      let response;
      if (action === 'approve') {
        response = await adminWorkerService.approveWorker(workerId);
      } else if (action === 'reject') {
        response = await adminWorkerService.rejectWorker(workerId, 'Rejected by Admin');
      } else {
        response = await adminWorkerService.suspendWorker(workerId);
      }

      if (response.success) {
        toast.success(response.message || `Worker ${action}d successfully`);
        fetchWorkers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} worker`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Workers</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalWorkers}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <FiUser className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Vendor Linked</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              {workers.filter(w => w.vendorId).length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <FiBriefcase className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active & Online</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">
              {workers.filter(w => w.status === 'ONLINE').length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <FiTrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search workers by name, phone, categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:border-green-500 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="worker">Vendor Associated</option>
            <option value="labour">Independent Labour</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:border-green-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Blocked Only</option>
          </select>

          <div className="px-3 py-2 bg-green-50 rounded-lg border border-green-100">
            <span className="text-xs font-bold text-green-700">{totalWorkers} Workers</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Worker</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Association</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Skills/Categories</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Approval</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-xs text-gray-500">Loading workers...</td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-xs text-gray-500">No workers found</td>
                </tr>
              ) : (
                workers.map((worker) => (
                  <tr key={worker._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 overflow-hidden">
                          {worker.profilePhoto ? (
                            <img src={worker.profilePhoto} alt={worker.name} className="w-full h-full object-cover" />
                          ) : (
                            <FiUser className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{worker.name}</p>
                          <p className="text-[10px] text-gray-400">ID: {worker._id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {worker.email && (
                          <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                            <FiMail className="w-3 h-3" />
                            <span>{worker.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                          <FiPhone className="w-3 h-3" />
                          <span>{worker.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {worker.vendorId ? (
                        <div className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-lg text-[10px] font-medium w-fit">
                          <FiBriefcase className="w-3 h-3" />
                          <span>Vendor-Linked</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg text-[10px] font-medium w-fit">
                          <FiUser className="w-3 h-3" />
                          <span>Labour (Independent)</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {worker.serviceCategories && worker.serviceCategories.length > 0 ? (
                          worker.serviceCategories.map((cat, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-700 border border-gray-200 rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                              {typeof cat === 'object' ? cat.title : cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400">No categories</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${worker.approvalStatus === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : worker.approvalStatus === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                        }`}>
                        {worker.approvalStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${worker.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {worker.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {worker.approvalStatus !== 'approved' && (
                          <button
                            onClick={() => handleApprovalAction(worker._id, 'approve')}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="Approve Worker"
                          >
                            <FiCheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {worker.approvalStatus === 'pending' && (
                          <button
                            onClick={() => handleApprovalAction(worker._id, 'reject')}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Reject Worker"
                          >
                            <FiXCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusToggle(worker._id, worker.isActive)}
                          className={`p-1.5 rounded-lg transition-colors ${worker.isActive
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-green-500 hover:bg-green-50'
                            }`}
                          title={worker.isActive ? 'Block Worker' : 'Activate Worker'}
                        >
                          {worker.isActive ? <FiSlash className="w-3.5 h-3.5" /> : <FiCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteWorker(worker._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Worker"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && workers.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
              Showing {workers.length} of {totalWorkers} workers
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50 hover:bg-white transition-all"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 disabled:opacity-50 hover:bg-white transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllWorkers;
