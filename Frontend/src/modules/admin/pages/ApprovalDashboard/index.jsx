import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShield, FiUser, FiMapPin, FiClock, FiCheck, FiX, 
  FiAlertCircle, FiCheckCircle, FiXCircle, FiTrendingUp,
  FiFilter, FiLayers, FiTag, FiTrash2
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import adminManagementService from '../../../../services/adminManagementService';
import { cityService } from '../../services/cityService';

const REQUEST_TYPE_ICONS = {
  category: <FiLayers className="text-blue-500" />,
  brand: <FiTag className="text-indigo-500" />,
  delete_vendor: <FiTrash2 className="text-red-500" />
};

const REQUEST_TYPE_LABELS = {
  category: '📁 Category Propose',
  brand: '🏷️ Brand Propose',
  delete_vendor: '🗑️ Vendor Deletion'
};

const ApprovalDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await adminManagementService.getCityAdminRequests();
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      toast.error('Failed to load proposal requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this proposal?')) return;
    try {
      setActionLoading(true);
      const res = await adminManagementService.approveRequest(id);
      if (res.success) {
        toast.success(res.message || 'Proposal approved and executed successfully!');
        fetchRequests();
      }
    } catch (err) {
      console.error('Approve error:', err);
      toast.error(err.response?.data?.message || 'Failed to approve request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await adminManagementService.rejectRequest(selectedRequest._id, rejectReason);
      if (res.success) {
        toast.success('Proposal request rejected.');
        setIsRejectModalOpen(false);
        setRejectReason('');
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err) {
      console.error('Reject error:', err);
      toast.error('Failed to reject request.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    if (activeFilter === 'all') return true;
    return req.status === activeFilter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
            <FiShield className="text-blue-600 w-7 h-7" /> Approval Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review, approve, or decline proposals submitted by City Admins</p>
        </div>
      </div>

      {/* Stats Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => setActiveFilter('all')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${activeFilter === 'all' ? 'bg-blue-50/50 border-blue-200 shadow-md scale-[1.02]' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Proposals</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              ∑
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-3">{requests.length}</p>
        </div>

        <div 
          onClick={() => setActiveFilter('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${activeFilter === 'pending' ? 'bg-yellow-50/50 border-yellow-200 shadow-md scale-[1.02]' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pending Approval</span>
            <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
              <FiClock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-3">{pendingCount}</p>
        </div>

        <div 
          onClick={() => setActiveFilter('approved')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${activeFilter === 'approved' ? 'bg-green-50/50 border-green-200 shadow-md scale-[1.02]' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Approved</span>
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-3">{approvedCount}</p>
        </div>

        <div 
          onClick={() => setActiveFilter('rejected')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${activeFilter === 'rejected' ? 'bg-red-50/50 border-red-200 shadow-md scale-[1.02]' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Rejected</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <FiXCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900 mt-3">{rejectedCount}</p>
        </div>
      </div>

      {/* Main Request Listing Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <FiFilter className="text-gray-400" /> Filter: {activeFilter.toUpperCase()}
          </h3>
          <span className="text-xs text-gray-500 font-semibold">{filteredRequests.length} record(s) found</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
            <p className="text-xs font-semibold">Loading proposals list...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 text-gray-400 flex flex-col items-center justify-center gap-3">
            <FiAlertCircle className="w-10 h-10 text-gray-300 animate-bounce" />
            <div>
              <p className="font-bold text-gray-700">No proposals found</p>
              <p className="text-xs text-gray-500 mt-1">There are no records matching your active status filter.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredRequests.map((req) => (
              <div key={req._id} className="p-5 hover:bg-gray-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1 rounded-lg bg-gray-100 shrink-0">
                      {REQUEST_TYPE_ICONS[req.requestType] || <FiLayers className="text-gray-500" />}
                    </span>
                    <span className="text-sm font-black text-gray-900">
                      {REQUEST_TYPE_LABELS[req.requestType] || req.requestType}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                      req.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap font-medium">
                    <span className="flex items-center gap-1">
                      <FiUser className="w-3.5 h-3.5" /> Proposed by: <strong className="text-gray-700">{req.requestedBy?.name || req.requestedByName}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMapPin className="w-3.5 h-3.5" /> City: <strong className="text-gray-700">{req.cityName || req.cityId?.name}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3.5 h-3.5" /> Created on: <strong>{new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong>
                    </span>
                  </div>

                  {req.notes && (
                    <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-2.5 inline-block max-w-xl">
                      <span className="font-bold">City Admin Note:</span> {req.notes}
                    </p>
                  )}

                  {req.status === 'rejected' && req.rejectionReason && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 inline-block max-w-xl">
                      <span className="font-bold">Rejection Reason:</span> {req.rejectionReason}
                    </p>
                  )}

                  {/* Proposed Data Accordion/Preview */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden mt-3 max-w-3xl">
                    <div className="bg-gray-50/50 p-2.5 text-[11px] font-bold text-gray-700 border-b border-gray-100 flex justify-between items-center">
                      <span>PROPOSED PAYLOAD VALUES</span>
                    </div>
                    <div className="p-3 bg-gray-50/20 max-h-48 overflow-y-auto font-mono text-[10px] text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(req.proposedData, null, 2)}
                    </div>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleApprove(req._id)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-green-700 transition-all hover:scale-[1.02]"
                    >
                      <FiCheck className="w-4 h-4" /> Approve & Execute
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(req);
                        setIsRejectModalOpen(true);
                      }}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-red-700 transition-all hover:scale-[1.02]"
                    >
                      <FiX className="w-4 h-4" /> Decline Request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-base font-black text-gray-900 mb-2">Decline Proposal</h3>
            <p className="text-xs text-gray-500 mb-4">Please provide a feedback note/reason for rejecting this proposal request. This will be shown to the City Admin.</p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid slug name / categories mapping is incorrect..."
              rows={4}
              className="w-full border border-gray-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-semibold"
            />
            
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectReason('');
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                Decline Proposal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ApprovalDashboard;
