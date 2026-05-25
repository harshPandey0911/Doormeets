import React, { useState, useEffect, useCallback } from 'react';
import {
  FiInbox, FiClock, FiCheckCircle, FiXCircle,
  FiUser, FiCalendar, FiMessageSquare, FiRefreshCw, FiX
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import vendorRequestService from '../../services/vendorRequestService';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending', icon: FiClock, color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'approved', label: 'Approved', icon: FiCheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  { key: 'rejected', label: 'Rejected', icon: FiXCircle, color: 'text-red-500', bg: 'bg-red-100' }
];

const StatusBadge = ({ status }) => {
  const cfg = {
    pending:  { label: 'Pending',  icon: FiClock,       cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', icon: FiCheckCircle, cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', icon: FiXCircle,     cls: 'bg-red-100 text-red-600' }
  }[status] || { label: status, icon: FiClock, cls: 'bg-gray-100 text-gray-600' };

  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const VendorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Action modal state
  const [actionModal, setActionModal] = useState(null); // { request, type: 'approve'|'reject' }
  const [adminNote, setAdminNote] = useState('');
  const [isActing, setIsActing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await vendorRequestService.getAllRequests({ status: activeTab, limit: 50 });
      if (res.success) {
        setRequests(res.requests || []);
        setTotal(res.total || 0);
        setPendingCount(res.pendingCount || 0);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load vendor requests');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const openAction = (request, type) => {
    setActionModal({ request, type });
    setAdminNote('');
  };

  const handleAction = async () => {
    if (!actionModal) return;
    const { request, type } = actionModal;
    try {
      setIsActing(true);
      const res = await vendorRequestService.updateStatus(request.id, {
        status: type === 'approve' ? 'approved' : 'rejected',
        adminNote
      });
      if (res.success) {
        toast.success(`Request ${type === 'approve' ? 'approved' : 'rejected'} successfully`);
        setActionModal(null);
        fetchRequests();
      }
    } catch (err) {
      toast.error(err?.message || 'Action failed');
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Category requests from vendors — {pendingCount} pending review
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: total, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Pending', value: pendingCount, color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Reviewed', value: total - pendingCount, color: 'bg-green-50 text-green-700 border-green-100' }
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FiInbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No requests found</p>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === 'pending' ? 'All caught up!' : 'No requests in this category'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-lg font-black text-gray-900">{req.categoryName}</h3>
                    <StatusBadge status={req.status} />
                  </div>

                  {/* Vendor Info */}
                  {req.vendor && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <FiUser className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{req.vendor.name}</p>
                        {req.vendor.businessName && (
                          <p className="text-xs text-gray-400">{req.vendor.businessName}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  {req.reason && (
                    <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 mb-2">
                      <FiMessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600 leading-relaxed">{req.reason}</p>
                    </div>
                  )}

                  {/* Admin Note */}
                  {req.adminNote && (
                    <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3 mb-2">
                      <FiMessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-700 leading-relaxed">
                        <span className="font-bold">Your note: </span>{req.adminNote}
                      </p>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      <span>Submitted: {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {req.reviewedAt && (
                      <div className="flex items-center gap-1">
                        <FiCheckCircle className="w-3 h-3" />
                        <span>Reviewed: {new Date(req.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons — only for pending */}
                {req.status === 'pending' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => openAction(req, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition active:scale-95"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openAction(req, 'reject')}
                      className="px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition active:scale-95 border border-red-200"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-5 ${actionModal.type === 'approve' ? 'bg-green-50 border-b border-green-100' : 'bg-red-50 border-b border-red-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {actionModal.type === 'approve' ? (
                    <FiCheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <FiXCircle className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      {actionModal.type === 'approve' ? 'Approve Request' : 'Reject Request'}
                    </h3>
                    <p className="text-sm text-gray-500">{actionModal.request.categoryName}</p>
                  </div>
                </div>
                <button onClick={() => setActionModal(null)} className="p-2 hover:bg-white/60 rounded-xl transition">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Note for Vendor (Optional)
                </label>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder={actionModal.type === 'approve'
                    ? 'e.g. Category will be live within 24 hours...'
                    : 'e.g. This category already exists under a different name...'}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActionModal(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={isActing}
                  className={`flex-1 py-3 text-white font-bold rounded-2xl transition text-sm disabled:opacity-60 ${
                    actionModal.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isActing ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    actionModal.type === 'approve' ? 'Confirm Approve' : 'Confirm Reject'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRequests;
