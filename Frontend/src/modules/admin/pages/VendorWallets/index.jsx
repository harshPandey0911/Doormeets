import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiRefreshCw, FiLock, FiUnlock, FiAlertTriangle, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';

const VendorWallets = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [frozenOnly, setFrozenOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Freeze modal state
  const [freezeModal, setFreezeModal] = useState(null); // { vendorId, vendorName, currentlyFrozen }
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeLoading, setFreezeLoading] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search.trim()) params.set('search', search.trim());
      if (frozenOnly) params.set('frozenOnly', 'true');

      const res = await api.get(`/admin/vendors/wallets?${params.toString()}`);
      if (res.data.success) {
        setVendors(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load vendor wallets');
    } finally {
      setLoading(false);
    }
  }, [page, search, frozenOnly]);

  useEffect(() => {
    const t = setTimeout(fetchVendors, 300);
    return () => clearTimeout(t);
  }, [fetchVendors]);

  const handleFreezeToggle = (vendor) => {
    setFreezeReason('');
    setFreezeModal({
      vendorId: vendor._id,
      vendorName: vendor.businessName || vendor.name,
      currentlyFrozen: vendor.wallet?.isBlocked || false,
    });
  };

  const confirmFreezeToggle = async () => {
    if (!freezeModal) return;
    setFreezeLoading(true);
    try {
      const willFreeze = !freezeModal.currentlyFrozen;
      const res = await api.patch(`/admin/vendors/${freezeModal.vendorId}/wallet/freeze`, {
        freeze: willFreeze,
        reason: freezeReason || undefined,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setFreezeModal(null);
        fetchVendors();
      } else {
        toast.error(res.data.message || 'Action failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update wallet status');
    } finally {
      setFreezeLoading(false);
    }
  };

  const totalFrozen = vendors.filter(v => v.wallet?.isBlocked).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          💳 Vendor Wallets
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View wallet balances and manage freeze status for all vendors.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Vendors</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{pagination?.total ?? '—'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Frozen Wallets</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalFrozen}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Earnings</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ₹{vendors.reduce((s, v) => s + (v.wallet?.earnings || 0), 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Dues</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">
            ₹{vendors.reduce((s, v) => s + (v.wallet?.dues || 0), 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, phone, or business..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Frozen Filter Toggle */}
          <button
            onClick={() => { setFrozenOnly(p => !p); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              frozenOnly
                ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
                : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
            }`}
          >
            <FiLock className="w-4 h-4" />
            {frozenOnly ? 'Frozen Only' : 'All Vendors'}
          </button>

          {/* Refresh */}
          <button
            onClick={fetchVendors}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition-all"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vendor</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Earnings</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dues</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Withdrawn</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Wallet Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">💳</span>
                      <p className="font-medium">No vendors found</p>
                    </div>
                  </td>
                </tr>
              ) : vendors.map(vendor => {
                const isFrozen = vendor.wallet?.isBlocked || false;
                const earnings = vendor.wallet?.earnings || 0;
                const dues = vendor.wallet?.dues || 0;
                const withdrawn = vendor.wallet?.totalWithdrawn || 0;

                return (
                  <tr key={vendor._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isFrozen ? 'bg-red-50/40 dark:bg-red-900/10' : ''}`}>
                    {/* Vendor Info */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(vendor.businessName || vendor.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                            {vendor.businessName || vendor.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{vendor.phone}</p>
                          {isFrozen && vendor.wallet?.blockReason && (
                            <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 font-medium flex items-center gap-1">
                              <FiAlertTriangle className="w-3 h-3" />
                              {vendor.wallet.blockReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Earnings */}
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-green-600 dark:text-green-400">₹{earnings.toLocaleString('en-IN')}</span>
                    </td>

                    {/* Dues */}
                    <td className="px-4 py-4 text-right">
                      <span className={`font-semibold ${dues > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                        ₹{dues.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Withdrawn */}
                    <td className="px-4 py-4 text-right">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">₹{withdrawn.toLocaleString('en-IN')}</span>
                    </td>

                    {/* Wallet Status */}
                    <td className="px-4 py-4 text-center">
                      {isFrozen ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                          <FiLock className="w-3 h-3" /> Frozen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                          <FiCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => handleFreezeToggle(vendor)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isFrozen
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {isFrozen ? <><FiUnlock className="w-3 h-3" /> Unfreeze</> : <><FiLock className="w-3 h-3" /> Freeze</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.pages} &middot; {pagination.total} vendors
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Freeze / Unfreeze Modal */}
      {freezeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[slideUp_0.2s_ease-out]">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${freezeModal.currentlyFrozen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {freezeModal.currentlyFrozen ? <FiUnlock className="w-5 h-5" /> : <FiLock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    {freezeModal.currentlyFrozen ? 'Unfreeze Wallet' : 'Freeze Wallet'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{freezeModal.vendorName}</p>
                </div>
              </div>
              <button onClick={() => setFreezeModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {freezeModal.currentlyFrozen
                ? `This will unfreeze the wallet for ${freezeModal.vendorName} and allow withdrawals again.`
                : `This will freeze the wallet for ${freezeModal.vendorName}. They will not be able to withdraw earnings until unfrozen.`}
            </p>

            {/* Reason (only for freeze) */}
            {!freezeModal.currentlyFrozen && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Reason <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={freezeReason}
                  onChange={e => setFreezeReason(e.target.value)}
                  placeholder="e.g. Suspicious withdrawal activity, policy violation..."
                  rows={3}
                  className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setFreezeModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmFreezeToggle}
                disabled={freezeLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
                  freezeModal.currentlyFrozen ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {freezeLoading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : freezeModal.currentlyFrozen ? (
                  <><FiUnlock className="w-4 h-4" /> Confirm Unfreeze</>
                ) : (
                  <><FiLock className="w-4 h-4" /> Confirm Freeze</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorWallets;
